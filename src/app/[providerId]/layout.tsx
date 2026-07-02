import type { Metadata } from 'next'
import { getSheetData } from '@/lib/sheets'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ providerId: string }>
}): Promise<Metadata> {
  const { providerId } = await params

  try {
    const rows = await getSheetData('providers!A2:N')
    const row = rows.find(r => r[0] === providerId)

    if (!row) {
      return {
        title: '職人主頁 | MooLah',
        description: '查看職人服務項目，透過 LINE 線上預約。',
      }
    }

    const name = row[1] || ''
    const category = row[2] || ''
    const storeName = row[6] || ''
    const address = row[7] || ''
    const description = row[3] || ''
    const avatarUrl = row[5] || ''

    const displayName = storeName || name
    const cityPrefix = address ? address.substring(0, 3) : '台灣'

    const title = `${displayName} — ${cityPrefix}${category} | MooLah`
    const desc = `${displayName}，${cityPrefix}優質${category}。${
      description || '專業服務，透過 LINE 一鍵線上預約，即時確認。'
    } | MooLah 美業預約平台`

    return {
      title,
      description: desc.length > 160 ? desc.substring(0, 157) + '...' : desc,
      alternates: { canonical: `${BASE_URL}/${providerId}` },
      openGraph: {
        title: `${displayName} — ${category}`,
        description: `${cityPrefix}${category}線上預約。專業${category}服務，透過 LINE 輕鬆預約。`,
        url: `${BASE_URL}/${providerId}`,
        type: 'profile',
        ...(avatarUrl ? { images: [{ url: avatarUrl, alt: displayName }] } : {}),
      },
    }
  } catch {
    return {
      title: '職人主頁 | MooLah',
      description: '查看職人服務項目，透過 LINE 線上預約。',
    }
  }
}

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
