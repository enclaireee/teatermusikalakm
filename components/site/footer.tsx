import Image from "next/image";
import { Icon, type IconName } from "@/components/ui/icon";
import { CONTACT, EVENT, SHOWS } from "@/lib/event";

const COLUMNS: { title: string; rows: [IconName, string, string?][] }[] = [
  {
    title: "Jadwal",
    rows: [
      ["calendar", EVENT.date],
      ["clock", `${SHOWS["1"].label} · ${SHOWS["1"].time} WIB`],
      ["clock", `${SHOWS["2"].label} · ${SHOWS["2"].time} WIB`],
      ["map-pin", EVENT.venue],
    ],
  },
  {
    title: "Kontak",
    rows: [
      ["instagram", `${CONTACT.instagram} (Instagram & TikTok)`, "https://instagram.com/stage.ui"],
      ["mail", CONTACT.email, `mailto:${CONTACT.email}`],
      ...CONTACT.persons.map(
        (p): [IconName, string, string] => ["phone", `${p.name} · ${p.phone} · Line ${p.line}`, `https://wa.me/62${p.phone.replace(/\D/g, "").slice(1)}`],
      ),
    ],
  },
];

/** Dark-green footer (Figma "Footer"). */
export function Footer() {
  return (
    <footer className="bg-bg-brand-strong text-text-on-brand">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-10 lg:gap-10 lg:px-20 lg:py-16">
        <div data-reveal-stagger data-reveal="up" className="flex flex-col gap-8 lg:flex-row lg:gap-20">
          <div className="flex flex-col gap-4 lg:w-[420px]">
            <Image src="/logo-akm.webp" alt="Aku, Kau & Musik" width={700} height={516} className="h-24 w-auto self-start" />
            <p className="type-body-s">
              Teater musikal karya mahasiswa Stage Performing Arts, Produksi Media, Sekolah Vokasi UI, berkolaborasi dengan Juzzer.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-1 flex-col gap-3">
              <h2 className="type-h3 text-text-accent">{col.title}</h2>
              <ul className="flex flex-col gap-3">
                {col.rows.map(([icon, label, href]) => (
                  <li key={label} className="type-body-s flex items-center gap-2">
                    <Icon name={icon} size={18} />
                    {href ? (
                      <a href={href} className="underline-offset-4 hover:underline" {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                        {label}
                      </a>
                    ) : (
                      label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <hr className="border-text-on-brand/30" />
        <p data-reveal="fade" className="type-caption text-center lg:text-left">© 2026 Stage UI · {EVENT.presentedBy}</p>
      </div>
    </footer>
  );
}
