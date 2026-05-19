import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/*/admin', '/*/book', '/go/', '/my-bookings'] },
    sitemap: 'https://moolah-platform.vercel.app/sitemap.xml',
  }
}
