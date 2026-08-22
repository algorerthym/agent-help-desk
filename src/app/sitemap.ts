import type { MetadataRoute } from "next";
import { origin } from "@/lib/origin";

export default function sitemap(): MetadataRoute.Sitemap {
  const o = origin();
  return [
    { url: `${o}/`, changeFrequency: "daily", priority: 1 },
    { url: `${o}/observe`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${o}/observe/tasks`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${o}/observe/directory`, changeFrequency: "daily", priority: 0.7 },
    { url: `${o}/skill.md`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${o}/observe/arrivals`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${o}/llms.txt`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${o}/agents.json`, changeFrequency: "weekly", priority: 0.6 },
  ];
}
