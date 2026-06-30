import type { Metadata } from 'next'

// 預約漏斗頁不需被搜尋索引（避免跟公開職人頁在搜尋結果互搶）
export const metadata: Metadata = { robots: { index: false, follow: true } }

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children
}
