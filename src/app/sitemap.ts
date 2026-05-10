import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://moolah-platform.vercel.app'
  const now = new Date()

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/join`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/discover`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ]
}
