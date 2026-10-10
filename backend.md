# Backend setup (Supabase)

The checkout's source of truth lives in Supabase: seat holds, orders and payment proofs. The Next.js server talks to it with the **secret key** only (server actions in `app/pesan/actions.ts`, the API route `app/api/show/[show]`). The browser never talks to Supabase directly, so every table is locked down (RLS on, no policies, no grants to `anon`/`authenticated`).

Run the steps **in order** in Supabase Dashboard → **SQL Editor** (one new query per step, paste, Run). Blocks marked *idempotent* can be re-run safely.

How it works, in short:

- `seats` has one row per sellable seat per show (375 × 2 = 750; VIP seats are never sold online and are not in the DB).
- A seat is **taken** when `order_id is not null and (held_until is null or held_until > now())`. Holds last 10 minutes; an expired hold is simply free again (no cron).
- `hold_seats` creates an order (status `held`) and claims the seats atomically. If someone else got a seat first it fails with `SEATS_TAKEN` and lists the lost seats in the error detail.
- `submit_order` turns a live hold into a paid order (status `valid`), clears the hold timer and generates the 5-character booking code.
- Admins may later set an order to `invalid`; its seats stay locked.
- Ticket categories live in the `tiers` table, keyed `Platinum`, `Gold`, `Silver`, `Bronze` (each is a fixed seat area in `lib/seats.ts`), with a marketing name and a presale and normal price. The presale end time lives in the single-row `settings` table. `tier_price()` picks the presale price before that time, otherwise the normal price; a ticket category without a price cannot be booked.

## 1. Tables (idempotent)

```sql
create table if not exists public.tiers (
  tier  text primary key,   -- ticket category: 'Platinum', 'Gold', 'Silver', 'Bronze'
  title text not null,      -- seat area description, e.g. 'Tengah depan'
  sort  int not null default 0
);
-- Category data (also upgrades a DB created by an older version of this doc).
alter table public.tiers add column if not exists name text;      -- marketing name shown to buyers, e.g. 'Hemat Tipis'
alter table public.tiers add column if not exists price_presale int check (price_presale is null or price_presale >= 0);
alter table public.tiers add column if not exists price_normal  int check (price_normal is null or price_normal >= 0);
alter table public.tiers drop column if exists price;
alter table public.tiers drop column if exists subtitle;

-- Single-row settings. presale_until null = no presale.
create table if not exists public.settings (
  id            boolean primary key default true check (id),
  presale_until timestamptz
);
insert into public.settings (id) values (true) on conflict do nothing;

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  code        text unique check (code is null or length(code) = 5),
  show_id     smallint not null check (show_id in (1, 2)),
  tier        text not null references public.tiers,
  qty         smallint not null check (qty between 1 and 4),
  buyer_name  text not null,
  buyer_email text not null,
  buyer_phone text not null,
  buyer_org   text,
  method      text check (method in ('qris', 'transfer')),
  total       int not null,
  status      text not null default 'held' check (status in ('held', 'valid', 'invalid')),
  proof_path  text,
  held_until  timestamptz,
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);

create table if not exists public.seats (
  show_id    smallint not null check (show_id in (1, 2)),
  seat_id    text not null,
  tier       text not null references public.tiers,
  order_id   uuid references public.orders on delete set null,
  held_until timestamptz,
  primary key (show_id, seat_id)
);

create index if not exists seats_order_id_idx on public.seats (order_id);

-- Lock down right away: Supabase auto-grants new public tables to anon/authenticated.
-- RLS on with NO policies + no grants = the public keys can read or write nothing. Only the server (service_role) can.
alter table public.tiers    enable row level security;
alter table public.orders   enable row level security;
alter table public.seats    enable row level security;
alter table public.settings enable row level security;
revoke all on public.tiers, public.orders, public.seats, public.settings from public, anon, authenticated;
grant select, insert, update, delete on public.tiers, public.orders, public.seats, public.settings to service_role;
```

## 2. Ticket categories (idempotent, never overwrites your edits)

One row per ticket category, each a fixed seat area. Titles (the area description) match `lib/event.ts`; names and prices are the committee's confirmed ones. A re-run only fills columns that are still empty, so later changes from step 8 are never overwritten.

| Category | Seat area | Name | Presale | Normal |
| --- | --- | --- | --- | --- |
| Platinum | center, front rows A–D & G (62/show) | Hemat Tipis | 45.000 | 50.000 |
| Gold | center, back rows H–O (135/show) | Hemat Aja | 40.000 | 45.000 |
| Silver | wings, front rows A–G (88/show) | Hemat Banget | 35.000 | 40.000 |
| Bronze | wings, back rows H–O (90/show) | Hemat Parah | 30.000 | 35.000 |

The first part only matters if you set up the database with an older version of this doc (categories named `Tipe 1`..`Tipe 4`): it moves their names, prices, seats and orders to the new categories and removes the old rows. On a fresh database or a re-run it does nothing.

```sql
-- Upgrade from the old keys: Tipe 1 → Platinum, Tipe 2 → Gold, Tipe 3 → Silver, Tipe 4 → Bronze.
insert into public.tiers (tier, title, sort, name, price_presale, price_normal)
select m.new_key, o.title, o.sort,
       case when o.name is null or o.name = o.tier then m.seed_name else o.name end,
       o.price_presale, o.price_normal
  from (values ('Tipe 1', 'Platinum', 'Hemat Tipis'), ('Tipe 2', 'Gold', 'Hemat Aja'),
               ('Tipe 3', 'Silver', 'Hemat Banget'), ('Tipe 4', 'Bronze', 'Hemat Parah')) as m(old_key, new_key, seed_name)
  join public.tiers o on o.tier = m.old_key
on conflict (tier) do nothing;

update public.seats s set tier = m.new_key
  from (values ('Tipe 1', 'Platinum'), ('Tipe 2', 'Gold'), ('Tipe 3', 'Silver'), ('Tipe 4', 'Bronze')) as m(old_key, new_key)
 where s.tier = m.old_key;

update public.orders o set tier = m.new_key
  from (values ('Tipe 1', 'Platinum'), ('Tipe 2', 'Gold'), ('Tipe 3', 'Silver'), ('Tipe 4', 'Bronze')) as m(old_key, new_key)
 where o.tier = m.old_key;

delete from public.tiers where tier in ('Tipe 1', 'Tipe 2', 'Tipe 3', 'Tipe 4');

-- Seed: fills only what is still empty.
insert into public.tiers as t (tier, title, sort, name, price_presale, price_normal) values
  ('Platinum', 'Tengah depan',    1, 'Hemat Tipis',  45000, 50000),
  ('Gold',     'Tengah belakang', 2, 'Hemat Aja',    40000, 45000),
  ('Silver',   'Sayap depan',     3, 'Hemat Banget', 35000, 40000),
  ('Bronze',   'Sayap belakang',  4, 'Hemat Parah',  30000, 35000)
on conflict (tier) do update set
  title         = excluded.title,
  sort          = excluded.sort,
  name          = coalesce(t.name, excluded.name),
  price_presale = coalesce(t.price_presale, excluded.price_presale),
  price_normal  = coalesce(t.price_normal, excluded.price_normal);
```

The presale end date starts empty (`settings.presale_until = null`), so normal prices apply until you set it in step 8.

## 3. Seat seed (idempotent)

Generated from `lib/seats.ts` by `node --experimental-strip-types scripts/gen-seed-sql.ts`. If the seat plan ever changes, re-generate and replace this block. Re-running only re-applies each seat's ticket category; it never frees a seat.

```sql
-- Generated by scripts/gen-seed-sql.ts. Per show: Platinum 62, Gold 135, Silver 88, Bronze 90 (VIP excluded)
insert into public.seats (show_id, seat_id, tier)
select s.show_id, t.seat_id, t.tier
from (values (1::smallint), (2::smallint)) as s(show_id)
cross join (
  select 'Platinum' as tier, unnest(array[
    'A16','A15','A14','A13','A12','A11','A10','A9','A8','A7',
    'B19','B18','B17','B16','B15','B14','B13','B12','B11','B10','B9','B8','B7',
    'C19','C18','C17','C16','C15','C14','C13','C12','C11','C10','C9','C8','C7',
    'D19','D18','D17','D16','D15','D14','D13','D12','D11','D10','D9','D8','D7',
    'G20','G19','G18','G17','G16','G15','G14','G13','G12','G11','G10','G9','G8'
  ]) as seat_id
  union all
  select 'Gold' as tier, unnest(array[
    'H21','H20','H19','H18','H17','H16','H15','H14','H13','H12','H11','H10','H9','H8',
    'I22','I21','I20','I19','I18','I17','I16','I15','I14','I13','I12','I11','I10','I9','I8',
    'J22','J21','J20','J19','J18','J17','J16','J15','J14','J13','J12','J11','J10','J9','J8','J7',
    'K22','K21','K20','K19','K18','K17','K16','K15','K14','K13','K12','K11','K10','K9','K8','K7',
    'L23','L22','L21','L20','L19','L18','L17','L16','L15','L14','L13','L12','L11','L10','L9','L8','L7',
    'M23','M22','M21','M20','M19','M18','M17','M16','M15','M14','M13','M12','M11','M10','M9','M8','M7','M6',
    'N25','N24','N23','N22','N21','N20','N19','N18','N17','N16','N15','N14','N13','N12','N11','N10','N9','N8','N7','N6',
    'O22','O21','O20','O19','O18','O17','O16','O15','O14','O13','O12','O11','O10','O9','O8','O7','O6','O5','O4'
  ]) as seat_id
  union all
  select 'Silver' as tier, unnest(array[
    'A22','A21','A20','A19','A18','A17','A6','A5','A4','A3','A2','A1',
    'B25','B24','B23','B22','B21','B20','B6','B5','B4','B3','B2','B1',
    'C25','C24','C23','C22','C21','C20','C6','C5','C4','C3','C2','C1',
    'D25','D24','D23','D22','D21','D20','D6','D5','D4','D3','D2','D1',
    'E24','E23','E22','E21','E20','E19','E6','E5','E4','E3','E2','E1',
    'F27','F26','F25','F24','F23','F22','F21','F7','F6','F5','F4','F3','F2','F1',
    'G27','G26','G25','G24','G23','G22','G21','G7','G6','G5','G4','G3','G2','G1'
  ]) as seat_id
  union all
  select 'Bronze' as tier, unnest(array[
    'H28','H27','H26','H25','H24','H23','H22','H7','H6','H5','H4','H3','H2','H1',
    'I29','I28','I27','I26','I25','I24','I23','I7','I6','I5','I4','I3','I2','I1',
    'J28','J27','J26','J25','J24','J23','J6','J5','J4','J3','J2','J1',
    'K28','K27','K26','K25','K24','K23','K6','K5','K4','K3','K2','K1',
    'L29','L28','L27','L26','L25','L24','L6','L5','L4','L3','L2','L1',
    'M28','M27','M26','M25','M24','M5','M4','M3','M2','M1',
    'N30','N29','N28','N27','N26','N5','N4','N3','N2','N1',
    'O25','O24','O23','O3','O2','O1'
  ]) as seat_id
) as t
on conflict (show_id, seat_id) do update set tier = excluded.tier;
```

## 4. Functions (idempotent)

All business rules run inside Postgres so two buyers can never get the same seat. Each function is locked down right after it is created (Supabase auto-grants new functions to `anon`/`authenticated`), so only the server (secret key = `service_role`) can call them.

```sql
-- Current price of a ticket category: presale price until settings.presale_until (if it has one), else the normal price.
-- null = not on sale.
create or replace function public.tier_price(p_tier text)
returns int
language sql stable
set search_path = ''
as $$
  select case when t.price_presale is not null and now() < (select s.presale_until from public.settings s)
              then t.price_presale else t.price_normal end
    from public.tiers t
   where t.tier = p_tier;
$$;
revoke all on function public.tier_price(text) from public, anon, authenticated;
grant execute on function public.tier_price(text) to service_role;

-- Hold seats for 10 minutes and create a 'held' order.
-- p_prev_order: the buyer's previous hold (e.g. they went back and changed seats); it is released first.
-- Errors (in the message): INVALID_SHOW, INVALID_QTY, DUPLICATE_SEATS, PRICE_NOT_SET, SEATS_TAKEN (detail = lost seat ids, comma separated).
create or replace function public.hold_seats(
  p_show smallint, p_tier text, p_seats text[],
  p_name text, p_email text, p_phone text, p_org text,
  p_prev_order uuid default null
) returns table (order_id uuid, held_until timestamptz, total int)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_qty   int := coalesce(cardinality(p_seats), 0);
  v_price int;
  v_id    uuid;
  v_until timestamptz := now() + interval '10 minutes';
  v_got   text[];
  v_lost  text[];
begin
  if p_show is null or p_show not in (1, 2) then
    raise exception 'INVALID_SHOW';
  end if;
  if v_qty not between 1 and 4 or array_position(p_seats, null) is not null then
    raise exception 'INVALID_QTY';
  end if;
  if (select count(distinct s) from unnest(p_seats) s) <> v_qty then
    raise exception 'DUPLICATE_SEATS';
  end if;
  v_price := public.tier_price(p_tier);
  if v_price is null then
    raise exception 'PRICE_NOT_SET';
  end if;

  -- Lock order row first, then seat rows in a fixed order (same order as submit_order),
  -- so concurrent holds and payments wait for each other instead of deadlocking.
  perform 1 from public.orders where id = p_prev_order for update;
  perform 1 from public.seats
   where (show_id = p_show and seat_id = any (p_seats)) or order_id = p_prev_order
   order by show_id, seat_id
   for update;

  -- Release the buyer's previous hold, but only while it is still unpaid.
  if exists (select 1 from public.orders where id = p_prev_order and status = 'held') then
    update public.seats set order_id = null, held_until = null where order_id = p_prev_order;
    delete from public.orders where id = p_prev_order;
  end if;

  insert into public.orders (show_id, tier, qty, buyer_name, buyer_email, buyer_phone, buyer_org, total, held_until)
  values (p_show, p_tier, v_qty, p_name, p_email, p_phone, nullif(p_org, ''), v_price * v_qty, v_until)
  returning id into v_id;

  with claimed as (
    update public.seats
       set order_id = v_id, held_until = v_until
     where show_id = p_show
       and seat_id = any (p_seats)
       and tier = p_tier
       and (order_id is null or held_until < now())
    returning seat_id
  )
  select coalesce(array_agg(seat_id), '{}') into v_got from claimed;

  if cardinality(v_got) <> v_qty then
    v_lost := array(select s from unnest(p_seats) s where s <> all (v_got) order by s);
    raise exception 'SEATS_TAKEN' using detail = array_to_string(v_lost, ',');
  end if;

  return query select v_id, v_until, v_price * v_qty;
end;
$$;
revoke all on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid) to service_role;

-- Turn a live hold into a paid order and generate its booking code.
-- Errors: INVALID_METHOD, ORDER_NOT_FOUND, ORDER_NOT_HELD (already paid/invalid), HOLD_EXPIRED.
create or replace function public.submit_order(p_order uuid, p_method text, p_proof_path text)
returns table (code text, paid_at timestamptz)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_order public.orders;
  v_held  int;
  v_code  text;
  v_bytes bytea;
  v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 chars, no I/O/0/1
begin
  if p_method is null or p_method not in ('qris', 'transfer') or coalesce(p_proof_path, '') = '' then
    raise exception 'INVALID_METHOD';
  end if;

  select * into v_order from public.orders where id = p_order for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status <> 'held' then
    raise exception 'ORDER_NOT_HELD';
  end if;
  if v_order.held_until is null or v_order.held_until <= now() then
    raise exception 'HOLD_EXPIRED';
  end if;
  -- Every seat must still belong to this order (lock them so nobody takes them mid-way).
  select count(*) into v_held
    from (select 1 from public.seats where order_id = p_order order by show_id, seat_id for update) s;
  if v_held <> v_order.qty then
    raise exception 'HOLD_EXPIRED';
  end if;

  -- 5 random chars (gen_random_uuid is a strong RNG; byte % 32 is unbiased). Retry on collision.
  for attempt in 1..10 loop
    v_bytes := uuid_send(gen_random_uuid());
    v_code := '';
    for i in 0..4 loop
      v_code := v_code || substr(v_alpha, get_byte(v_bytes, i) % 32 + 1, 1);
    end loop;
    begin
      update public.orders set code = v_code where id = p_order;
      exit;
    exception when unique_violation then
      v_code := null;
    end;
  end loop;
  if v_code is null then
    raise exception 'CODE_COLLISION';
  end if;

  update public.orders
     set status = 'valid', method = p_method, proof_path = p_proof_path, paid_at = now(), held_until = null
   where id = p_order;
  update public.seats set held_until = null where order_id = p_order;

  return query select v_code, now();
end;
$$;
revoke all on function public.submit_order(uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_order(uuid, text, text) to service_role;

-- Ticket lookup for "Cek tiket": booking code + email (email is case-insensitive). Only paid orders have a code.
drop function if exists public.lookup_ticket(text, text);
create function public.lookup_ticket(p_code text, p_email text)
returns table (
  code text, show_id smallint, tier text, tier_name text, seats text[],
  buyer_name text, buyer_email text, buyer_phone text,
  method text, total int, status text, paid_at timestamptz
)
language sql stable
set search_path = ''
as $$
  select o.code, o.show_id, o.tier,
         (select coalesce(t.name, t.tier) from public.tiers t where t.tier = o.tier),
         array(select s.seat_id from public.seats s where s.order_id = o.id
               order by left(s.seat_id, 1), substr(s.seat_id, 2)::int),
         o.buyer_name, o.buyer_email, o.buyer_phone,
         o.method, o.total, o.status, o.paid_at
    from public.orders o
   where o.code = upper(trim(p_code))
     and lower(o.buyer_email) = lower(trim(p_email));
$$;
revoke all on function public.lookup_ticket(text, text) from public, anon, authenticated;
grant execute on function public.lookup_ticket(text, text) to service_role;

-- Public availability for one show: presale state, per ticket category its name, current price and seats left,
-- plus taken seat ids. No buyer data.
create or replace function public.show_availability(p_show smallint)
returns jsonb
language sql stable
set search_path = ''
as $$
  with taken as (
    select seat_id, tier from public.seats
     where show_id = p_show and order_id is not null and (held_until is null or held_until > now())
  )
  select jsonb_build_object(
    'presale', coalesce(
      (select jsonb_build_object('active', coalesce(now() < s.presale_until, false), 'until', s.presale_until)
         from public.settings s),
      '{"active": false, "until": null}'::jsonb),
    'tiers', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'tier', t.tier, 'title', t.title, 'name', coalesce(t.name, t.tier),
               'price', public.tier_price(t.tier), 'priceNormal', t.price_normal,
               'left', (select count(*) from public.seats s where s.show_id = p_show and s.tier = t.tier)
                     - (select count(*) from taken k where k.tier = t.tier)
             ) order by t.sort), '[]'::jsonb)
        from public.tiers t
    ),
    'taken', (select coalesce(jsonb_agg(seat_id order by seat_id), '[]'::jsonb) from taken)
  );
$$;
revoke all on function public.show_availability(smallint) from public, anon, authenticated;
grant execute on function public.show_availability(smallint) to service_role;
```

## 5. Re-apply function grants (idempotent, optional)

Step 4 already locks each function down. This block repeats all of it in one place: run it if you ever changed a function by hand, or just to be sure.

```sql
revoke all on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.submit_order(uuid, text, text) from public, anon, authenticated;
revoke all on function public.lookup_ticket(text, text) from public, anon, authenticated;
revoke all on function public.show_availability(smallint) from public, anon, authenticated;
revoke all on function public.tier_price(text) from public, anon, authenticated;
grant execute on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid) to service_role;
grant execute on function public.submit_order(uuid, text, text) to service_role;
grant execute on function public.lookup_ticket(text, text) to service_role;
grant execute on function public.show_availability(smallint) to service_role;
grant execute on function public.tier_price(text) to service_role;
```

## 6. Storage bucket for payment proofs (idempotent)

Private bucket, 3 MB max, JPG/PNG/PDF only. No storage policies: only the server (secret key) can upload or read. Files are stored as `{show}/{order_id}.{ext}`; `orders.proof_path` holds that path.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 3145728, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
```

To view a proof: Dashboard → **Storage** → `payment-proofs` → open the show folder → the file named after the order id.

Proofs are untrusted uploads from strangers: open them only in a sandboxed viewer (e.g. the browser's built-in PDF/image viewer), never in a desktop PDF reader with scripting enabled.

## 7. Check queries (read-only)

Expect `750` total (375 per show = 400 minus the 25 VIP seats), and per show: Platinum = 62, Gold = 135, Silver = 88, Bronze = 90.

```sql
select count(*) as total_seats from public.seats; -- 750

select show_id, tier as category, count(*) as seats
  from public.seats join public.tiers using (tier)
 group by show_id, tier, sort order by show_id, sort;

-- Ticket categories and prices. current_price null = that category cannot be booked yet.
select tier as category, title, name, price_presale, price_normal, public.tier_price(tier) as current_price
  from public.tiers order by sort;

-- Presale end (null = no presale).
select presale_until, now() < presale_until as presale_active from public.settings;

select public.show_availability(1::smallint);
```

## 8. Change categories & prices / presale end

Step 2 already set the categories and prices. Use these only to change them later (Rupiah, whole numbers). The site reads names and prices from here. An order keeps the total from the moment it was held, so changing a price (or presale ending) never changes existing orders. A ticket category with no price at all cannot be booked.

```sql
-- Example: change a ticket category's prices and/or name.
update public.tiers set price_presale = 45000, price_normal = 50000 where tier = 'Platinum';
update public.tiers set name = 'Hemat Tipis' where tier = 'Platinum';
-- Stop selling a ticket category online: set both prices to null.
update public.tiers set price_presale = null, price_normal = null where tier = 'Bronze';
```

**Presale.** Presale prices apply until `presale_until` (always include the timezone; `+07` = WIB):

```sql
update public.settings set presale_until = '2026-10-20 23:59:59+07';  -- set or move the presale end
update public.settings set presale_until = now();                     -- end presale early (right now)
update public.settings set presale_until = null;                      -- no presale: normal prices only
```

## 9. Environment variables

1. Copy `.env.example` to `.env.local` in the repo root (`.env.local` is git-ignored).
2. `SUPABASE_URL`: Dashboard → **Project Settings** → **Data API** (or **API**) → Project URL, e.g. `https://abcd1234.supabase.co`.
3. `SUPABASE_SECRET_KEY`: Dashboard → **Project Settings** → **API Keys** → **Secret keys** → create/reveal one (starts with `sb_secret_`). Older projects without the new keys can use the legacy `service_role` key from the same page.
4. Restart `npm run dev`. On Vercel (or another host), add both variables in the project's environment settings.

Never prefix these with `NEXT_PUBLIC_`, never commit them, and never paste the secret key into client code: it bypasses all security.

## 10. Reset test data (destructive, run once when you want a clean slate)

Frees every seat and deletes **all** orders. Do this only before going live.

```sql
update public.seats set order_id = null, held_until = null;
delete from public.orders;
```

Then delete the uploaded test proofs: Dashboard → **Storage** → `payment-proofs` → select all files → Delete. (Supabase blocks deleting storage files with SQL.)

## 11. Maintenance

**Clean up abandoned holds** (idempotent, safe any time). Expired holds already free their seats; this just removes old unpaid orders (and their buyer data) once they are a day past expiry. Seat references are released first so the delete never touches a seat that is still pointing at the order.

```sql
update public.seats s set order_id = null, held_until = null
  from public.orders o
 where s.order_id = o.id and o.status = 'held' and o.held_until < now() - interval '1 day';

delete from public.orders o
 where o.status = 'held' and o.held_until < now() - interval '1 day'
   and not exists (select 1 from public.seats s where s.order_id = o.id);
```

**Release the seats of an invalid order** (manual override, NOT default). By the owner's decision an order marked `invalid` keeps its seats locked, so nobody else can buy them. Only if the committee decides to resell those seats, run this with the booking code:

```sql
update public.seats set order_id = null, held_until = null
 where order_id = (select id from public.orders where code = 'XXXXX' and status = 'invalid');
```

**At the door:** the ticket PDF is generated in the buyer's browser, so it can be edited. Door staff must check each ticket against the database (the "Cek tiket" page with code + email, or the `orders` table), and accept only status `valid`.
