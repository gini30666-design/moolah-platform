export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight mb-2">MooLah</h1>
        <p className="text-sm text-gray-400 mb-10">預約，輕鬆一點</p>

        <div className="space-y-3 text-left">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">合作服務類別</p>
          {[
            '💇 髮型設計師',
            '🐾 寵物美容師',
            '🚗 汽車美容師',
            '💅 美甲師',
          ].map(label => (
            <div
              key={label}
              className="bg-white rounded-xl px-4 py-3.5 shadow-sm text-sm text-gray-700 font-medium"
            >
              {label}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-300 mt-10">
          透過設計師的 LINE 官方帳號開始預約
        </p>
      </div>
    </main>
  )
}
