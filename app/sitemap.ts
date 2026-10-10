import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/event";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/tiket`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
