import { MetadataRoute } from 'next'
import { getSheetData } from '@/lib/sheets'

const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

const staticPages: MetadataRoute.Sitemap = [
  { url: base,                             lastModified: new Date('2026-05-18'), changeFrequency: 'weekly',  priority: 1.0 },
  { url: `${base}/discover`,               lastModified: new Date('2026-05-18'), changeFrequency: 'daily',   priority: 0.9 },
  { url: `${base}/how-it-works`,           lastModified: new Date('2026-06-04'), changeFrequency: 'monthly', priority: 0.9 },
  { url: `${base}/for-providers`,          lastModified: new Date('2026-06-04'), changeFrequency: 'monthly', priority: 0.9 },
  { url: `${base}/services`,               lastModified: new Date('2026-05-18'), changeFrequency: 'monthly', priority: 0.8 },
  // Category landing pages (#4)
  { url: `${base}/services/hair-stylist`,  lastModified: new Date('2026-06-03'), changeFrequency: 'weekly',  priority: 0.85 },
  { url: `${base}/services/pet-grooming`,  lastModified: new Date('2026-06-03'), changeFrequency: 'weekly',  priority: 0.85 },
  { url: `${base}/services/auto-detailing`,lastModified: new Date('2026-06-03'), changeFrequency: 'weekly',  priority: 0.85 },
  { url: `${base}/services/nail`,          lastModified: new Date('2026-06-03'), changeFrequency: 'weekly',  priority: 0.85 },
  { url: `${base}/join`,                   lastModified: new Date('2026-05-18'), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${base}/features/booking`,       lastModified: new Date('2026-05-13'), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${base}/features/scheduling`,    lastModified: new Date('2026-05-13'), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${base}/features/notification`,  lastModified: new Date('2026-05-13'), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${base}/privacy`,                lastModified: new Date('2026-05-15'), changeFrequency: 'yearly',  priority: 0.3 },
  { url: `${base}/terms`,                  lastModified: new Date('2026-05-15'), changeFrequency: 'yearly',  priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let providerEntries: MetadataRoute.Sitemap = []

  try {
    const rows = await getSheetData('providers!A2:A')
    providerEntries = rows
      .filter((r) => r[0] && typeof r[0] === 'string')
      .map((r) => ({
        url: `${base}/${r[0]}`,
        lastModified: new Date('2026-05-18'),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
  } catch {
    // Sheets unavailable at build time — skip provider entries
  }

  return [...staticPages, ...providerEntries]
}
