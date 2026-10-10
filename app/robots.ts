import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/event";

export default function robots(): MetadataRoute.Robots {
  return {
    // /pesan and /admin stay crawlable so bots see their noindex; listing /admin here would also advertise it.
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
