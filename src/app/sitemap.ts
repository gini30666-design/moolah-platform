import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://moolah-platform.vercel.app'

  return [
    { url: base,                              lastModified: new Date('2026-05-18'), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/discover`,                lastModified: new Date('2026-05-18'), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/services`,                lastModified: new Date('2026-05-18'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/join`,                    lastModified: new Date('2026-05-18'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features/booking`,        lastModified: new Date('2026-05-13'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/features/scheduling`,     lastModified: new Date('2026-05-13'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/features/notification`,   lastModified: new Date('2026-05-13'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacy`,                 lastModified: new Date('2026-05-15'), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,                   lastModified: new Date('2026-05-15'), changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
