# Backend setup (Supabase)

The checkout's source of truth lives in Supabase: seat holds, orders and payment proofs. The Next.js server talks to it with the **secret key** only (server actions in `app/pesan/actions.ts`, the API route `app/api/show/[show]`). The browser never talks to Supabase directly, so every table is locked down (RLS on, no policies, no grants to `anon`/`authenticated`).

**Numbered steps (1–10) are the only SQL you must run**: in order, in Supabase Dashboard → **SQL Editor**, one new query per step, paste, Run. Every numbered step is safe to re-run. Everything after them (checks, changing prices or quotas, maintenance) is unnumbered: run it only when you need it.

> **Already ran the old version of this doc (steps 1–7)?** Those are steps 1–5 now. Run **step 6** and **step 7**.
>
> **Already ran steps 1–6?** Run **step 7** and **step 8**.
>
> **Already ran steps 1–7?** Run **step 8** and **step 9**.
>
> **Already ran steps 1–8?** Run **step 9** and **step 10**.
>
> **Already ran steps 1–9?** Run **step 10** only (ticket claimed).

How it works, in short:

- `seats` has one row per sellable seat per show (375 × 2 = 750; VIP seats are never sold online and are not in the DB).
- A seat is **taken** when `order_id is not null and (held_until is null or held_until > now())`. Holds last 10 minutes; an expired hold is simply free again (no cron).
- `hold_seats` creates an order (status `held`) and claims the seats atomically. If someone else got a seat first it fails with `SEATS_TAKEN` and lists the lost seats in the error detail.
- `submit_order` turns a live hold into a paid order (status `valid`), clears the hold timer and generates the 5-character booking code.
- Admins may later set an order to `invalid`; its seats stay locked.
- The admin panel (`/admin`, step 7) has its own **admin-only** check, `orders.checked` (empty = not reviewed, true = valid, false = not valid). Buyers never see it; it does not change `status`.
- On show day the admin panel marks when a buyer picked up the physical ticket, `orders.claimed_at` (step 10; empty = not picked up yet). Also admin-only.
- Ticket categories live in the `tiers` table, keyed `Platinum`, `Gold`, `Silver`, `Bronze` (each is a fixed seat area in `lib/seats.ts`), with a marketing name and a presale and normal price. Whether presale is on is a manual switch (`settings.presale`, toggled on `/admin`, step 8). `tier_price()` picks the presale price while it is on, otherwise the normal price; a ticket category without a price cannot be booked.
- Each category also has a **quota per show**: `quota_presale` and `quota_sale`. During presale at most `quota_presale` seats of that category can be taken per show; after presale the limit is `quota_presale + quota_sale`, so unsold presale tickets move to the sale. "Taken" counts paid, invalid and live-held seats. `hold_seats` checks the quota under a lock, so two buyers can never both get the last ticket.
- Broken seats have `seats.blocked = true`: they are never sold and the site shows them as taken.

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

One row per ticket category, each a fixed seat area. Titles (the area description) match `lib/event.ts`; names and prices are the committee's confirmed ones. A re-run only fills columns that are still empty, so your later changes (see **Change categories, prices, presale, quotas**) are never overwritten.

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

Presale starts off, so normal prices apply until you switch it on in `/admin` (step 8).

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

> **Already ran step 8?** Re-run step 8 right after this step (it replaces `tier_price` with the presale switch version).

All business rules run inside Postgres so two buyers can never get the same seat. Each function is locked down right after it is created (Supabase auto-grants new functions to `anon`/`authenticated`), so only the server (secret key = `service_role`) can call them. `hold_seats`, `submit_order` and `show_availability` are in step 6, together with the quotas they enforce.

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
```

## 5. Storage bucket for payment proofs (idempotent)

Private bucket, 1 MB max, JPG/PNG/PDF only. No storage policies: only the server (secret key) can upload or read. Files are stored as `{show}/{order_id}.{ext}`; `orders.proof_path` holds that path.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 1048576, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
```

To view a proof: Dashboard → **Storage** → `payment-proofs` → open the show folder → the file named after the order id.

Proofs are untrusted uploads from strangers: open them only in a sandboxed viewer (e.g. the browser's built-in PDF/image viewer), never in a desktop PDF reader with scripting enabled.

## 6. Ticket quotas & broken seats (idempotent)

> **Already ran step 8?** Re-run step 8 right after this step (it replaces `tier_cap`, `hold_seats` and `show_availability` with the presale switch versions).

Quota per ticket category, **per show** (committee numbers):

| Category | Name | Presale | Sale | Total |
| --- | --- | --- | --- | --- |
| Platinum | Hemat Tipis | 25 | 37 | 62 |
| Gold | Hemat Aja | 50 | 83 | 133 |
| Silver | Hemat Banget | 30 | 57 | 87 |
| Bronze | Hemat Parah | 30 | 60 | 90 |

During presale a show sells at most the presale number of a category. After presale the limit is presale + sale, so unsold presale tickets move to the sale. Seats B1 (Silver), I8 and K21 (Gold) are broken: they are blocked in both shows, never sold, and shown as taken. That is why Gold totals 133 of 135 seats and Silver 87 of 88.

A re-run never overwrites quotas you changed later, but it does block B1, I8 and K21 again.

```sql
-- Quota per show for each ticket category. null = no quota (only the seats limit).
alter table public.tiers add column if not exists quota_presale int check (quota_presale is null or quota_presale >= 0);
alter table public.tiers add column if not exists quota_sale    int check (quota_sale is null or quota_sale >= 0);
-- Broken seats: never sold, shown as taken.
alter table public.seats add column if not exists blocked boolean not null default false;

-- Committee quotas. Fills only empty values.
update public.tiers t
   set quota_presale = coalesce(t.quota_presale, q.presale),
       quota_sale    = coalesce(t.quota_sale, q.sale)
  from (values ('Platinum', 25, 37), ('Gold', 50, 83), ('Silver', 30, 57), ('Bronze', 30, 60)) as q(tier, presale, sale)
 where t.tier = q.tier;

-- Broken seats, both shows.
update public.seats set blocked = true where seat_id in ('B1', 'I8', 'K21');

-- How many seats of a ticket category one show may have taken right now:
-- quota_presale during presale, quota_presale + quota_sale after it. quota_presale null = no quota.
create or replace function public.tier_cap(p_tier text)
returns int
language sql stable
set search_path = ''
as $$
  select case when now() < (select s.presale_until from public.settings s)
              then t.quota_presale
              else t.quota_presale + coalesce(t.quota_sale, 0) end
    from public.tiers t
   where t.tier = p_tier;
$$;
revoke all on function public.tier_cap(text) from public, anon, authenticated;
grant execute on function public.tier_cap(text) to service_role;

-- Hold seats for 10 minutes and create a 'held' order.
-- p_prev_order: the buyer's previous hold (e.g. they went back and changed seats); it is released first.
-- Errors (in the message): INVALID_SHOW, INVALID_QTY, DUPLICATE_SEATS, PRICE_NOT_SET, QUOTA_FULL,
-- SEATS_TAKEN (detail = lost seat ids, comma separated; broken seats also fail this way).
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
  v_cap   int;
  v_taken int;
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

  -- Lock the ticket category first: holds of one category wait for each other here, so the quota
  -- count below can't be raced. Then the order row, then seat rows in a fixed order (same as submit_order),
  -- so concurrent holds and payments wait for each other instead of deadlocking.
  perform 1 from public.tiers where tier = p_tier for update;
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

  -- Quota: seats of this category already taken in this show (paid, invalid or live hold) plus this hold.
  v_cap := public.tier_cap(p_tier);
  if v_cap is not null then
    select count(*) into v_taken
      from public.seats
     where show_id = p_show and tier = p_tier
       and order_id is not null and (held_until is null or held_until > now());
    if v_taken + v_qty > v_cap then
      raise exception 'QUOTA_FULL';
    end if;
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
       and not blocked
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

  -- Same lock order as hold_seats (ticket category → order → seats), so a payment and a new hold of the same
  -- category can't both count a hold that is expiring right now: one waits for the other.
  perform 1 from public.tiers where tier = (select o.tier from public.orders o where o.id = p_order) for update;
  select * into v_order from public.orders where id = p_order for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status <> 'held' then
    raise exception 'ORDER_NOT_HELD';
  end if;
  -- clock_timestamp, not now(): now() is when this call started, before any wait for the locks above.
  if v_order.held_until is null or v_order.held_until <= clock_timestamp() then
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

-- Public availability for one show: presale state, per ticket category its name, current price and
-- tickets left (seats left, capped by the quota), plus taken seat ids (sold + broken). No buyer data.
create or replace function public.show_availability(p_show smallint)
returns jsonb
language sql stable
set search_path = ''
as $$
  with sold as (  -- paid, invalid or live hold: counts against the quota
    select seat_id, tier from public.seats
     where show_id = p_show and order_id is not null and (held_until is null or held_until > now())
  ), taken as (   -- greyed out on the seat map: sold + broken
    select seat_id, tier from sold
    union
    select seat_id, tier from public.seats where show_id = p_show and blocked
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
               -- least() ignores null, so no quota = seats left only
               'left', greatest(0, least(
                 (select count(*) from public.seats s where s.show_id = p_show and s.tier = t.tier)
                   - (select count(*) from taken k where k.tier = t.tier),
                 public.tier_cap(t.tier) - (select count(*) from sold k where k.tier = t.tier)))
             ) order by t.sort), '[]'::jsonb)
        from public.tiers t
    ),
    'taken', (select coalesce(jsonb_agg(seat_id order by seat_id), '[]'::jsonb) from taken)
  );
$$;
revoke all on function public.show_availability(smallint) from public, anon, authenticated;
grant execute on function public.show_availability(smallint) to service_role;
```

## 7. Admin panel (idempotent)

The admin panel lives at `/admin`. No page on the site links to it, and it asks for a login first (`ADMIN_USER` / `ADMIN_PASSWORD`, see [Environment variables](#environment-variables)). It lists every paid order (status `valid` or `invalid`; unpaid holds are left out), shows the payment proof, and can mark an order checked, mark its physical ticket picked up (step 10), edit the buyer, move seats and delete orders.

- **Checked** (`orders.checked`) is only for the committee's own review. It does not change `status`, so the buyer's "Cek tiket" page and the door check are unaffected.
- **Move seats** keeps the same show, ticket category and number of seats, so the price and quota never change. Done atomically by `move_seats` below: if someone grabs a target seat first, nothing moves.
- **Delete** removes the order and its payment proof. Its seats become free and can be bought again. Done by `delete_order` below, which locks the seats in the same order as the other functions so it never deadlocks with a buyer.

```sql
-- Admin-only review mark: null = not reviewed yet, true = valid, false = not valid. Never shown to buyers.
alter table public.orders add column if not exists checked boolean;

-- Move a paid (or invalid) order to other seats: same show, same ticket category, same number of seats.
-- Errors: ORDER_NOT_FOUND, ORDER_NOT_PAID (still a hold), BAD_SEATS (wrong count, duplicate, unknown seat or
-- another category), SEATS_TAKEN (detail = taken seat ids, comma separated; broken seats also fail this way).
create or replace function public.move_seats(p_order uuid, p_seats text[])
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
  v_taken text[];
begin
  -- Same lock order as hold_seats / submit_order: the order row, then seat rows in a fixed order.
  select * into v_order from public.orders where id = p_order for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status = 'held' then
    raise exception 'ORDER_NOT_PAID';
  end if;
  if coalesce(cardinality(p_seats), 0) <> v_order.qty or array_position(p_seats, null) is not null
     or (select count(distinct s) from unnest(p_seats) s) <> v_order.qty then
    raise exception 'BAD_SEATS';
  end if;

  perform 1 from public.seats
   where (show_id = v_order.show_id and seat_id = any (p_seats)) or order_id = p_order
   order by show_id, seat_id
   for update;

  if (select count(*) from public.seats
       where show_id = v_order.show_id and seat_id = any (p_seats) and tier = v_order.tier) <> v_order.qty then
    raise exception 'BAD_SEATS';
  end if;

  v_taken := array(
    select seat_id from public.seats
     where show_id = v_order.show_id and seat_id = any (p_seats)
       and (blocked or (order_id is not null and order_id <> p_order and (held_until is null or held_until > now())))
     order by seat_id);
  if cardinality(v_taken) > 0 then
    raise exception 'SEATS_TAKEN' using detail = array_to_string(v_taken, ',');
  end if;

  update public.seats set order_id = null, held_until = null
   where order_id = p_order and seat_id <> all (p_seats);
  update public.seats set order_id = p_order, held_until = null
   where show_id = v_order.show_id and seat_id = any (p_seats);
end;
$$;
revoke all on function public.move_seats(uuid, text[]) from public, anon, authenticated;
grant execute on function public.move_seats(uuid, text[]) to service_role;

-- Delete a paid (or invalid) order and free its seats. Returns the payment proof path (the server
-- removes that file; Supabase blocks deleting storage files from SQL). Errors: ORDER_NOT_FOUND.
create or replace function public.delete_order(p_order uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_proof text;
begin
  select proof_path into v_proof from public.orders where id = p_order and status <> 'held' for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  perform 1 from public.seats where order_id = p_order order by show_id, seat_id for update;
  update public.seats set order_id = null, held_until = null where order_id = p_order;
  delete from public.orders where id = p_order;
  return v_proof;
end;
$$;
revoke all on function public.delete_order(uuid) from public, anon, authenticated;
grant execute on function public.delete_order(uuid) to service_role;
```

## 8. Manual presale switch (idempotent)

Presale is now a manual switch on `/admin` ("Presale" / "Harga normal") instead of an end date. While it is on, every ticket category with a presale price sells at that price and the presale quotas apply; switching it off moves to the normal prices and full quotas immediately. Each order also remembers whether it was bought at the presale price (`orders.presale`), shown in the admin panel.

- `settings.presale_until` is retired: this step carries a still-running presale over into the switch once and clears the date. The column stays so older steps keep working.
- This step replaces `tier_price`, `tier_cap`, `show_availability` and `hold_seats`. **If you ever re-run step 4 or 6, re-run this step and then step 9 right after.**

```sql
-- The switch. Off by default (normal prices).
alter table public.settings add column if not exists presale boolean not null default false;
-- Carry over a presale that was still running by date, then retire the date (no-op on a re-run).
update public.settings set presale = (presale_until > now()), presale_until = null where presale_until is not null;

-- Did this order get the presale price? Set by hold_seats; old orders backfilled below.
alter table public.orders add column if not exists presale boolean;
update public.orders o
   set presale = (t.price_presale is not null and t.price_presale <> t.price_normal and o.total = o.qty * t.price_presale)
  from public.tiers t
 where t.tier = o.tier and o.presale is null;

create or replace function public.presale_active()
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce((select s.presale from public.settings s), false);
$$;
revoke all on function public.presale_active() from public, anon, authenticated;
grant execute on function public.presale_active() to service_role;

-- Current price of a ticket category: the presale price while presale is on (if it has one), else the normal price.
-- null = not on sale.
create or replace function public.tier_price(p_tier text)
returns int
language sql stable
set search_path = ''
as $$
  select case when t.price_presale is not null and public.presale_active() then t.price_presale else t.price_normal end
    from public.tiers t
   where t.tier = p_tier;
$$;
revoke all on function public.tier_price(text) from public, anon, authenticated;
grant execute on function public.tier_price(text) to service_role;

-- How many seats of a ticket category one show may have taken right now:
-- quota_presale while presale is on, quota_presale + quota_sale after it. quota_presale null = no quota.
create or replace function public.tier_cap(p_tier text)
returns int
language sql stable
set search_path = ''
as $$
  select case when public.presale_active()
              then t.quota_presale
              else t.quota_presale + coalesce(t.quota_sale, 0) end
    from public.tiers t
   where t.tier = p_tier;
$$;
revoke all on function public.tier_cap(text) from public, anon, authenticated;
grant execute on function public.tier_cap(text) to service_role;

-- Same as step 6, plus orders.presale.
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
  v_cap   int;
  v_taken int;
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

  -- Lock the ticket category first: holds of one category wait for each other here, so the quota
  -- count below can't be raced. Then the order row, then seat rows in a fixed order (same as submit_order),
  -- so concurrent holds and payments wait for each other instead of deadlocking.
  perform 1 from public.tiers where tier = p_tier for update;
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

  -- Quota: seats of this category already taken in this show (paid, invalid or live hold) plus this hold.
  v_cap := public.tier_cap(p_tier);
  if v_cap is not null then
    select count(*) into v_taken
      from public.seats
     where show_id = p_show and tier = p_tier
       and order_id is not null and (held_until is null or held_until > now());
    if v_taken + v_qty > v_cap then
      raise exception 'QUOTA_FULL';
    end if;
  end if;

  -- presale = this order got the presale price. Derived from v_price (the price actually charged), so it always
  -- matches the total even if the switch flips mid-hold; same rule as the backfill above.
  insert into public.orders (show_id, tier, qty, buyer_name, buyer_email, buyer_phone, buyer_org, total, held_until, presale)
  values (p_show, p_tier, v_qty, p_name, p_email, p_phone, nullif(p_org, ''), v_price * v_qty, v_until,
          (select coalesce(t.price_presale <> t.price_normal and v_price = t.price_presale, false)
             from public.tiers t where t.tier = p_tier))
  returning id into v_id;

  with claimed as (
    update public.seats
       set order_id = v_id, held_until = v_until
     where show_id = p_show
       and seat_id = any (p_seats)
       and tier = p_tier
       and not blocked
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

-- Same as step 6, but presale is { "active": true|false } (no end date any more).
create or replace function public.show_availability(p_show smallint)
returns jsonb
language sql stable
set search_path = ''
as $$
  with sold as (  -- paid, invalid or live hold: counts against the quota
    select seat_id, tier from public.seats
     where show_id = p_show and order_id is not null and (held_until is null or held_until > now())
  ), taken as (   -- greyed out on the seat map: sold + broken
    select seat_id, tier from sold
    union
    select seat_id, tier from public.seats where show_id = p_show and blocked
  )
  select jsonb_build_object(
    'presale', jsonb_build_object('active', public.presale_active()),
    'tiers', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'tier', t.tier, 'title', t.title, 'name', coalesce(t.name, t.tier),
               'price', public.tier_price(t.tier), 'priceNormal', t.price_normal,
               -- least() ignores null, so no quota = seats left only
               'left', greatest(0, least(
                 (select count(*) from public.seats s where s.show_id = p_show and s.tier = t.tier)
                   - (select count(*) from taken k where k.tier = t.tier),
                 public.tier_cap(t.tier) - (select count(*) from sold k where k.tier = t.tier)))
             ) order by t.sort), '[]'::jsonb)
        from public.tiers t
    ),
    'taken', (select coalesce(jsonb_agg(seat_id order by seat_id), '[]'::jsonb) from taken)
  );
$$;
revoke all on function public.show_availability(smallint) from public, anon, authenticated;
grant execute on function public.show_availability(smallint) to service_role;
```

## 9. Rate limiting (idempotent)

Caps how often one network (IP address, IPv6 per /64) can hold seats, submit payments, look up tickets and try the admin login, and how many unpaid holds it can have at once (6 orders, so at most 24 seats), so a script can't keep a show "sold out" or guess the admin password. Limits live in `lib/rate-limit.ts` and below. Only a keyed hash of the IP is stored, never the IP itself. If this step hasn't run yet, the site still works, just without limits (the server logs `[rate-limit]` errors).

> This step replaces `hold_seats` (it adds `p_client`). **If you ever re-run step 4, 6 or 8, re-run this step right after.**

```sql
create table if not exists public.rate_limits (
  key      text primary key,      -- '{action}:{hashed ip}'
  hits     int not null,
  reset_at timestamptz not null
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.rate_limits to service_role;

-- Count one hit for p_key in a fixed window of p_window_s seconds. Returns false once the window has more than p_limit hits.
-- One atomic upsert, so concurrent requests can't both slip under the limit.
create or replace function public.rate_hit(p_key text, p_limit int, p_window_s int)
returns boolean
language sql
set search_path = ''
as $$
  insert into public.rate_limits as r (key, hits, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_s))
  on conflict (key) do update
     set hits     = case when r.reset_at <= now() then 1 else r.hits + 1 end,
         reset_at = case when r.reset_at <= now() then excluded.reset_at else r.reset_at end
  returning hits <= p_limit;
$$;
revoke all on function public.rate_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_hit(text, int, int) to service_role;

-- Live-hold cap: remember which client (hashed IP) made each hold.
alter table public.orders add column if not exists client text;
create index if not exists orders_client_held_idx on public.orders (client) where status = 'held';

-- Same as step 8, plus p_client and the TOO_MANY_HOLDS check. Drop the old signature so only one hold_seats exists.
drop function if exists public.hold_seats(smallint, text, text[], text, text, text, text, uuid);
create or replace function public.hold_seats(
  p_show smallint, p_tier text, p_seats text[],
  p_name text, p_email text, p_phone text, p_org text,
  p_prev_order uuid default null, p_client text default null
) returns table (order_id uuid, held_until timestamptz, total int)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_qty   int := coalesce(cardinality(p_seats), 0);
  v_price int;
  v_cap   int;
  v_taken int;
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

  -- Live-hold cap per client network (p_client = keyed hash of the buyer's IP, from the server). The advisory lock
  -- makes parallel requests from one client wait for each other, so they can't all slip under the cap.
  -- It is taken before any row lock, in every call, so it can't deadlock with them.
  if p_client is not null then
    perform pg_advisory_xact_lock(hashtext('hold:' || p_client));
    if (select count(*) from public.orders
         where client = p_client and status = 'held' and held_until > now()
           and id is distinct from p_prev_order) >= 6 then
      raise exception 'TOO_MANY_HOLDS';
    end if;
  end if;

  -- Lock the ticket category first: holds of one category wait for each other here, so the quota
  -- count below can't be raced. Then the order row, then seat rows in a fixed order (same as submit_order),
  -- so concurrent holds and payments wait for each other instead of deadlocking.
  perform 1 from public.tiers where tier = p_tier for update;
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

  -- Quota: seats of this category already taken in this show (paid, invalid or live hold) plus this hold.
  v_cap := public.tier_cap(p_tier);
  if v_cap is not null then
    select count(*) into v_taken
      from public.seats
     where show_id = p_show and tier = p_tier
       and order_id is not null and (held_until is null or held_until > now());
    if v_taken + v_qty > v_cap then
      raise exception 'QUOTA_FULL';
    end if;
  end if;

  -- presale = this order got the presale price. Derived from v_price (the price actually charged), so it always
  -- matches the total even if the switch flips mid-hold; same rule as the backfill above.
  insert into public.orders (show_id, tier, qty, buyer_name, buyer_email, buyer_phone, buyer_org, total, held_until, presale, client)
  values (p_show, p_tier, v_qty, p_name, p_email, p_phone, nullif(p_org, ''), v_price * v_qty, v_until,
          (select coalesce(t.price_presale <> t.price_normal and v_price = t.price_presale, false)
             from public.tiers t where t.tier = p_tier),
          p_client)
  returning id into v_id;

  with claimed as (
    update public.seats
       set order_id = v_id, held_until = v_until
     where show_id = p_show
       and seat_id = any (p_seats)
       and tier = p_tier
       and not blocked
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
revoke all on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid, text) to service_role;
```

Check it (expect `true`, `true`, `false`), then remove the test row:

```sql
select public.rate_hit('test', 2, 60);
select public.rate_hit('test', 2, 60);
select public.rate_hit('test', 2, 60);
delete from public.rate_limits where key = 'test';
```

## 10. Ticket claimed (idempotent)

On show day the committee taps **Tandai diambil** in `/admin` (order list or order page) when a buyer picks up the physical ticket. It stores the time in `orders.claimed_at`; **Batalkan** clears it. Only orders with status `valid` can be marked. Admin-only: buyers never see it and it does not change `status`.

> Run this **before** deploying the version of the site that has the button: the admin panel reads this column and fails to load without it.

```sql
-- Physical ticket picked up on show day: null = not yet, otherwise when. Never shown to buyers.
alter table public.orders add column if not exists claimed_at timestamptz;
```

## 11. Raise max tickets per order to 10 (idempotent)

Raises the per-order ticket limit from 4 to 10 (`MAX_TICKETS = 10` in `lib/event.ts`). Existing orders and seats are completely untouched: this only widens the `orders.qty` check constraint (whatever Postgres named it) and updates `hold_seats` to accept 1–10 seats.

> This step replaces `hold_seats`. **If you ever re-run step 6, 8 or 9, re-run this step right after.**

```sql
-- Widen the qty check constraint on public.orders to allow 1..10 (drops any old 1..4 qty check first, safely).
do $$
declare
  r record;
begin
  for r in
    select c.conname
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
     where c.conrelid = 'public.orders'::regclass
       and c.contype = 'c'
       and a.attname = 'qty'
  loop
    execute format('alter table public.orders drop constraint %I', r.conname);
  end loop;
  alter table public.orders add constraint orders_qty_check check (qty between 1 and 10);
end;
$$;

-- Same as step 9, with v_qty allowed between 1 and 10.
create or replace function public.hold_seats(
  p_show smallint, p_tier text, p_seats text[],
  p_name text, p_email text, p_phone text, p_org text,
  p_prev_order uuid default null, p_client text default null
) returns table (order_id uuid, held_until timestamptz, total int)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_qty   int := coalesce(cardinality(p_seats), 0);
  v_price int;
  v_cap   int;
  v_taken int;
  v_id    uuid;
  v_until timestamptz := now() + interval '10 minutes';
  v_got   text[];
  v_lost  text[];
begin
  if p_show is null or p_show not in (1, 2) then
    raise exception 'INVALID_SHOW';
  end if;
  if v_qty not between 1 and 10 or array_position(p_seats, null) is not null then
    raise exception 'INVALID_QTY';
  end if;
  if (select count(distinct s) from unnest(p_seats) s) <> v_qty then
    raise exception 'DUPLICATE_SEATS';
  end if;
  v_price := public.tier_price(p_tier);
  if v_price is null then
    raise exception 'PRICE_NOT_SET';
  end if;

  -- Live-hold cap per client network (p_client = keyed hash of the buyer's IP, from the server). The advisory lock
  -- makes parallel requests from one client wait for each other, so they can't all slip under the cap.
  -- It is taken before any row lock, in every call, so it can't deadlock with them.
  if p_client is not null then
    perform pg_advisory_xact_lock(hashtext('hold:' || p_client));
    if (select count(*) from public.orders
         where client = p_client and status = 'held' and held_until > now()
           and id is distinct from p_prev_order) >= 6 then
      raise exception 'TOO_MANY_HOLDS';
    end if;
  end if;

  -- Lock the ticket category first: holds of one category wait for each other here, so the quota
  -- count below can't be raced. Then the order row, then seat rows in a fixed order (same as submit_order),
  -- so concurrent holds and payments wait for each other instead of deadlocking.
  perform 1 from public.tiers where tier = p_tier for update;
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

  -- Quota: seats of this category already taken in this show (paid, invalid or live hold) plus this hold.
  v_cap := public.tier_cap(p_tier);
  if v_cap is not null then
    select count(*) into v_taken
      from public.seats
     where show_id = p_show and tier = p_tier
       and order_id is not null and (held_until is null or held_until > now());
    if v_taken + v_qty > v_cap then
      raise exception 'QUOTA_FULL';
    end if;
  end if;

  -- presale = this order got the presale price. Derived from v_price (the price actually charged), so it always
  -- matches the total even if the switch flips mid-hold; same rule as the backfill above.
  insert into public.orders (show_id, tier, qty, buyer_name, buyer_email, buyer_phone, buyer_org, total, held_until, presale, client)
  values (p_show, p_tier, v_qty, p_name, p_email, p_phone, nullif(p_org, ''), v_price * v_qty, v_until,
          (select coalesce(t.price_presale <> t.price_normal and v_price = t.price_presale, false)
             from public.tiers t where t.tier = p_tier),
          p_client)
  returning id into v_id;

  with claimed as (
    update public.seats
       set order_id = v_id, held_until = v_until
     where show_id = p_show
       and seat_id = any (p_seats)
       and tier = p_tier
       and not blocked
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
revoke all on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid, text) to service_role;
```

---

Everything below is **not** a setup step. Run it only when you need it.

## Check queries (read-only)

Expect `750` seats (375 per show = 400 minus the 25 VIP seats); per show Platinum 62, Gold 135, Silver 88, Bronze 90; and 6 blocked seats (B1, I8, K21 in each show).

```sql
select count(*) as total_seats, count(*) filter (where blocked) as blocked from public.seats; -- 750, 6

select show_id, tier as category, count(*) as seats
  from public.seats join public.tiers using (tier)
 group by show_id, tier, sort order by show_id, sort;

-- Ticket categories and prices. current_price null = that category cannot be booked yet.
select tier as category, title, name, price_presale, price_normal, public.tier_price(tier) as current_price
  from public.tiers order by sort;

-- Quotas per show: the limit right now, and how many are taken (paid, invalid or live hold).
select sh.show_id, t.tier as category, t.name, t.quota_presale, t.quota_sale, public.tier_cap(t.tier) as limit_now,
       (select count(*) from public.seats s
         where s.show_id = sh.show_id and s.tier = t.tier
           and s.order_id is not null and (s.held_until is null or s.held_until > now())) as taken
  from public.tiers t cross join (values (1::smallint), (2::smallint)) as sh(show_id)
 order by sh.show_id, t.sort;

-- Presale switch (step 8).
select presale from public.settings;

-- What the site sees for show 1 ("left" = tickets left).
select public.show_availability(1::smallint);
```

## Change categories, prices, presale, quotas

Steps 2 and 6 already set everything. Use these only to change it later (Rupiah, whole numbers). The site reads names, prices and quotas from here. An order keeps the total from the moment it was held, so changing a price (or presale ending) never changes existing orders. A ticket category with no price at all cannot be booked.

```sql
-- Change a ticket category's prices and/or name.
update public.tiers set price_presale = 45000, price_normal = 50000 where tier = 'Platinum';
update public.tiers set name = 'Hemat Tipis' where tier = 'Platinum';
-- Stop selling a ticket category online: set both prices to null.
update public.tiers set price_presale = null, price_normal = null where tier = 'Bronze';
```

**Presale.** Use the "Presale / Harga normal" switch at the top of `/admin` (step 8). It changes prices and quotas on the site immediately. The SQL equivalent:

```sql
update public.settings set presale = true;   -- presale prices + presale quotas
update public.settings set presale = false;  -- normal prices, full quota
```

**Quotas** (per show; lowering a quota never cancels tickets already sold, it only stops new ones):

```sql
update public.tiers set quota_presale = 25, quota_sale = 37 where tier = 'Platinum';
update public.tiers set quota_presale = null, quota_sale = null where tier = 'Bronze';  -- no quota: only the seats limit
```

**Broken seats:**

```sql
update public.seats set blocked = true  where seat_id = 'C5';                 -- block a seat in both shows
update public.seats set blocked = true  where seat_id = 'C5' and show_id = 2; -- or in one show only
update public.seats set blocked = false where seat_id = 'C5';                 -- sell it again
```

## Environment variables

- Copy `.env.example` to `.env.local` in the repo root (`.env.local` is git-ignored).
- `SUPABASE_URL`: Dashboard → **Project Settings** → **Data API** (or **API**) → Project URL, e.g. `https://abcd1234.supabase.co`.
- `SUPABASE_SECRET_KEY`: Dashboard → **Project Settings** → **API Keys** → **Secret keys** → create/reveal one (starts with `sb_secret_`). Older projects without the new keys can use the legacy `service_role` key from the same page.
- `ADMIN_USER` and `ADMIN_PASSWORD`: the single login for `/admin`. Pick them yourself; the password must be **at least 12 characters** (shorter ones are refused, so the login can't be guessed). Changing either one logs every admin out (logging out only clears that browser, so change the password if a login may have leaked).
- Restart `npm run dev`. On Vercel (or another host), add all four variables in the project's environment settings.

Never prefix these with `NEXT_PUBLIC_`, never commit them, and never paste the secret key into client code: it bypasses all security.

## Reset test data (destructive)

Frees every seat and deletes **all** orders. Do this only before going live. Broken seats stay blocked.

```sql
update public.seats set order_id = null, held_until = null;
delete from public.orders;
```

Then delete the uploaded test proofs: Dashboard → **Storage** → `payment-proofs` → select all files → Delete. (Supabase blocks deleting storage files with SQL.)

## Maintenance

**Clean up abandoned holds** (safe any time). Expired holds already free their seats; this just removes old unpaid orders (and their buyer data) once they are a day past expiry. Seat references are released first so the delete never touches a seat that is still pointing at the order.

```sql
update public.seats s set order_id = null, held_until = null
  from public.orders o
 where s.order_id = o.id and o.status = 'held' and o.held_until < now() - interval '1 day';

delete from public.orders o
 where o.status = 'held' and o.held_until < now() - interval '1 day'
   and not exists (select 1 from public.seats s where s.order_id = o.id);
```

**Clean up old rate-limit rows** (safe any time; expired rows are reset on the next hit anyway):

```sql
delete from public.rate_limits where reset_at < now() - interval '1 day';
```

**Release the seats of an invalid order** (manual override, NOT default). By the owner's decision an order marked `invalid` keeps its seats locked (and keeps counting against the quota), so nobody else can buy them. Only if the committee decides to resell those seats, run this with the booking code:

```sql
update public.seats set order_id = null, held_until = null
 where order_id = (select id from public.orders where code = 'XXXXX' and status = 'invalid');
```

**Re-apply function grants.** Every step already locks its functions down. Run this only if you ever changed a function by hand:

```sql
revoke all on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.submit_order(uuid, text, text) from public, anon, authenticated;
revoke all on function public.lookup_ticket(text, text) from public, anon, authenticated;
revoke all on function public.show_availability(smallint) from public, anon, authenticated;
revoke all on function public.tier_price(text) from public, anon, authenticated;
revoke all on function public.tier_cap(text) from public, anon, authenticated;
revoke all on function public.move_seats(uuid, text[]) from public, anon, authenticated;
revoke all on function public.delete_order(uuid) from public, anon, authenticated;
revoke all on function public.presale_active() from public, anon, authenticated;
revoke all on function public.rate_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.hold_seats(smallint, text, text[], text, text, text, text, uuid, text) to service_role;
grant execute on function public.submit_order(uuid, text, text) to service_role;
grant execute on function public.lookup_ticket(text, text) to service_role;
grant execute on function public.show_availability(smallint) to service_role;
grant execute on function public.tier_price(text) to service_role;
grant execute on function public.tier_cap(text) to service_role;
grant execute on function public.move_seats(uuid, text[]) to service_role;
grant execute on function public.delete_order(uuid) to service_role;
grant execute on function public.presale_active() to service_role;
grant execute on function public.rate_hit(text, int, int) to service_role;
```

**At the door:** the ticket PDF is generated in the buyer's browser, so it can be edited. Door staff must check each ticket against the database (the "Cek tiket" page with code + email, or the `orders` table), and accept only status `valid`.
