import Link from 'next/link'

const CATEGORIES = [
  { label: '💇 髮型設計師', href: '/designer-001', live: true },
  { label: '🐾 寵物美容師', href: null, live: false },
  { label: '🚗 汽車美容師', href: null, live: false },
  { label: '💅 美甲師', href: null, live: false },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-xs w-full">
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight mb-2">MooLah</h1>
        <p className="text-sm text-gray-400 mb-10">預約，輕鬆一點</p>

        <div className="space-y-3 text-left">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">合作服務類別</p>
          {CATEGORIES.map(({ label, href, live }) =>
            live && href ? (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5 shadow-sm text-sm text-gray-700 font-medium hover:shadow-md transition-shadow"
              >
                <span>{label}</span>
                <span className="text-xs text-[#9b8ea0]">查看 →</span>
              </Link>
            ) : (
              <div
                key={label}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5 shadow-sm text-sm text-gray-400"
              >
                <span>{label}</span>
                <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">即將推出</span>
              </div>
            )
          )}
        </div>

        <p className="text-xs text-gray-300 mt-10">
          透過設計師的 LINE 官方帳號開始預約
        </p>
      </div>
    </main>
  )
}
