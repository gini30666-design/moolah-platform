import type { Metadata } from 'next'

// 邀請連結不進搜尋引擎（連結本身就是憑證，被索引等於外流）
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function JoinTeamLayout({ children }: { children: React.ReactNode }) {
  return children
}
