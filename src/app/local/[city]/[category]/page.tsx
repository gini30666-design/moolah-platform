import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSheetData } from '@/lib/sheets'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export const revalidate = 3600

// ── 城市與品類定義 ─────────────────────────────────────────────
const CITIES: Record<string, { name: string; intro: string }> = {
  kaohsiung: {
    name: '高雄',
    intro: '從左營、鼓山到鳳山、三民，高雄的美業能量正在快速成長。MooLah 精選高雄在地職人，開放 LINE 線上預約——不用下載 App、不用來回私訊喬時間。',
  },
  pingtung: {
    name: '屏東',
    intro: '屏東的好手藝不輸都會區。MooLah 把屏東在地職人的時間表搬上線，LINE 點一點就完成預約，還會自動提醒你別忘了赴約。',
  },
}

const CATEGORIES: Record<string, {
  name: string; short: string; services: string; faq: { q: string; a: string }[]
}> = {
  nails: {
    name: '美甲師',
    short: '美甲',
    services: '光療凝膠、手繪款式、卸甲保養、指緣護理',
    faq: [
      { q: '凝膠美甲大約多久要卸甲或補甲一次？', a: '一般凝膠美甲的美觀期約 3–4 週，之後因指甲生長會出現後移縫隙，建議 3–4 週回店卸甲或補甲，避免翹邊藏污。透過 MooLah 預約完成後，系統會在回訪時間自動提醒你。' },
      { q: '線上預約美甲需要先付訂金嗎？', a: '透過 MooLah 預約採「到店付款」，線上不需先付款。預約成功後你會在 LINE 收到確認通知與行前提醒。' },
      { q: '第一次做美甲要怎麼選款式？', a: '可以先逛職人的作品集頁面，預約時直接勾選喜歡的作品當靈感參考，職人到店前就能理解你想要的風格。' },
    ],
  },
  hair: {
    name: '髮型設計師',
    short: '剪髮・染燙',
    services: '剪髮、染髮、燙髮、頭皮護理、造型設計',
    faq: [
      { q: '染燙前需要先跟設計師溝通嗎？', a: '建議預約時在備註欄寫下想要的風格或附上參考圖，設計師會提前評估髮況與所需時間，到店溝通會更有效率。' },
      { q: '線上預約剪髮會比較貴嗎？', a: '不會。MooLah 線上預約價格與現場一致、到店付款，還能避開現場排隊等待。' },
      { q: '臨時有事要改時間怎麼辦？', a: '在 LINE 的「我的預約」即可取消，再重新選擇新時段，異動會即時通知設計師。' },
    ],
  },
  'pet-grooming': {
    name: '寵物美容師',
    short: '寵物美容',
    services: '洗澡基礎護理、剃毛造型、SPA、指甲耳朵清潔',
    faq: [
      { q: '狗狗多久洗一次澡、做一次美容比較好？', a: '一般建議 2–4 週洗澡一次、6–8 週整理一次造型，依毛量與生活環境調整。預約完成後 MooLah 會在建議回訪時間透過 LINE 提醒你。' },
      { q: '第一次帶毛孩去新的美容店要注意什麼？', a: '預約時在備註寫下毛孩的品種、體重與特殊狀況（怕吹風機、皮膚敏感等），美容師能提前安排合適的流程與時段。' },
      { q: '寵物美容需要幾點前到店？', a: '建議提早 5–10 分鐘到店讓毛孩熟悉環境。透過 MooLah 預約後，行前提醒會自動發到你的 LINE。' },
    ],
  },
  'car-detailing': {
    name: '汽車美容師',
    short: '汽車美容',
    services: '鍍膜、打蠟、車體美容、內裝深層清潔',
    faq: [
      { q: '鍍膜跟打蠟差在哪？該怎麼選？', a: '打蠟成本低、光澤維持約 1–2 個月；鍍膜硬度與撥水性更好、可維持一年以上但價格較高。可先透過職人頁面的服務說明與價格比較，再線上預約諮詢。' },
      { q: '汽車美容一次大概要多久？', a: '基礎美容約 1–2 小時，鍍膜依車況約半天至一天。MooLah 預約時會顯示每項服務的預估時長，方便你安排接送時間。' },
      { q: '需要先把車開過去估價嗎？', a: '多數項目可直接線上預約；特殊車況可在預約備註說明或附註聯絡方式，職人會先與你確認再施工。' },
    ],
  },
}

// 首波開放的城市×品類組合
const COMBOS: [string, string][] = [
  ['kaohsiung', 'nails'],
  ['kaohsiung', 'hair'],
  ['kaohsiung', 'pet-grooming'],
  ['kaohsiung', 'car-detailing'],
  ['pingtung', 'nails'],
  ['pingtung', 'hair'],
]

export const dynamicParams = false

export function generateStaticParams() {
  return COMBOS.map(([city, category]) => ({ city, category }))
}

type Params = { city: string; category: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city, category } = await params
  const c = CITIES[city]; const k = CATEGORIES[category]
  if (!c || !k) return {}
  const title = `${c.name}${k.short}推薦・LINE 線上預約 | MooLah`
  const description = `${c.name}${k.name}線上預約平台。${k.services}，精選${c.name}在地職人，LINE 一鍵預約免下載 App，自動行前提醒不怕忘記。到店付款、免訂金。`
  const url = `${BASE_URL}/local/${city}/${category}`
  return {
    title,
    description,
    alternates: { canonical: url, languages: { 'zh-Hant-TW': url, 'x-default': url } },
    openGraph: { title, description, url },
  }
}

type ProviderCard = {
  id: string; name: string; storeName: string; district: string
  rating: string; reviewCount: string; tagline: string; avatarUrl: string
}

async function getProviders(cityName: string, categoryName: string): Promise<ProviderCard[]> {
  try {
    const rows = await getSheetData('providers!A2:T')
    return rows
      .filter(r => (r[2] ?? '') === categoryName && ((r[8] ?? '') + (r[7] ?? '')).includes(cityName))
      .map(r => ({
        id: r[0] ?? '', name: r[1] ?? '', storeName: r[6] ?? '', district: r[8] ?? '',
        rating: r[14] ?? '', reviewCount: r[15] ?? '', tagline: r[17] ?? '', avatarUrl: r[5] ?? '',
      }))
  } catch {
    return []
  }
}

export default async function LocalCategoryPage({ params }: { params: Promise<Params> }) {
  const { city, category } = await params
  const c = CITIES[city]; const k = CATEGORIES[category]
  if (!c || !k) notFound()

  const providers = await getProviders(c.name, k.name)
  const url = `${BASE_URL}/local/${city}/${category}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'MooLah', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: '探索職人', item: `${BASE_URL}/discover` },
          { '@type': 'ListItem', position: 3, name: `${c.name}${k.name}`, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: k.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      ...(providers.length > 0 ? [{
        '@type': 'ItemList',
        itemListElement: providers.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.name, url: `${BASE_URL}/${p.id}`,
        })),
      }] : []),
    ],
  }

  const otherCombos = COMBOS.filter(([ct, cat]) => !(ct === city && cat === category))

  return (
    <div style={{ background: 'var(--charcoal-deep)', minHeight: '100vh', color: 'var(--cream)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav style={{ background: 'rgba(26,23,20,0.96)', borderBottom: '1px solid rgba(166,137,102,0.18)' }} className="sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-5 h-14">
          <Link href="/" className="font-display text-base tracking-[.18em] uppercase" style={{ color: 'var(--cream)' }}>MooLah</Link>
          <Link href="/discover" className="text-sm" style={{ color: 'var(--oak)' }}>探索職人</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 pb-20">
        {/* Hero */}
        <header className="pt-12 pb-8">
          <p className="text-xs tracking-[.25em] uppercase mb-3" style={{ color: 'var(--oak)' }}>
            {c.name} · {k.short}
          </p>
          <h1 className="font-display text-3xl leading-snug mb-4" style={{ color: 'var(--cream)' }}>
            {c.name}{k.name}推薦<br />LINE 線上預約，免下載 App
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(251,249,244,0.65)' }}>
            {c.intro}
          </p>
        </header>

        {/* Providers */}
        <section className="mb-12">
          <h2 className="font-display text-xl mb-5" style={{ color: 'var(--cream)' }}>
            {c.name}的{k.name}
          </h2>
          {providers.length > 0 ? (
            <div className="flex flex-col gap-4">
              {providers.map(p => (
                <Link key={p.id} href={`/${p.id}`}
                  className="block rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
                  style={{ background: 'rgba(251,249,244,0.04)', border: '1px solid rgba(166,137,102,0.22)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-lg" style={{ color: 'var(--cream)' }}>{p.name}</span>
                    {p.rating && (
                      <span className="text-xs" style={{ color: 'var(--oak)' }}>★ {p.rating}{p.reviewCount ? `（${p.reviewCount}）` : ''}</span>
                    )}
                  </div>
                  {p.storeName && <p className="text-xs mb-1" style={{ color: 'rgba(251,249,244,0.5)' }}>{p.storeName}{p.district ? ` · ${p.district}` : ''}</p>}
                  {p.tagline && <p className="text-sm" style={{ color: 'rgba(251,249,244,0.7)' }}>{p.tagline}</p>}
                  <p className="text-xs mt-3" style={{ color: 'var(--oak)' }}>查看作品集與可預約時段 →</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(251,249,244,0.04)', border: '1px dashed rgba(166,137,102,0.3)' }}>
              <p className="text-sm mb-4" style={{ color: 'rgba(251,249,244,0.7)' }}>
                {c.name}的{k.name}正在陸續進駐中。你可以先到探索頁看看其他地區與類別的職人。
              </p>
              <Link href="/discover" className="inline-block rounded-full px-6 py-2.5 text-sm"
                style={{ background: 'var(--oak)', color: 'var(--charcoal-deep)' }}>
                探索全部職人
              </Link>
            </div>
          )}
        </section>

        {/* Why MooLah */}
        <section className="mb-12">
          <h2 className="font-display text-xl mb-5" style={{ color: 'var(--cream)' }}>為什麼用 MooLah 預約？</h2>
          <ul className="flex flex-col gap-3 text-sm" style={{ color: 'rgba(251,249,244,0.7)' }}>
            <li>✓ <strong style={{ color: 'var(--cream)' }}>LINE 直接預約</strong>——不用下載 App、不用註冊帳號</li>
            <li>✓ <strong style={{ color: 'var(--cream)' }}>即時看空檔</strong>——職人的可預約時段一目瞭然，不用私訊來回喬</li>
            <li>✓ <strong style={{ color: 'var(--cream)' }}>自動提醒</strong>——行前提醒直接發到你的 LINE，不怕忘記赴約</li>
            <li>✓ <strong style={{ color: 'var(--cream)' }}>到店付款</strong>——線上不需付訂金，價格與現場一致</li>
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="font-display text-xl mb-5" style={{ color: 'var(--cream)' }}>{c.name}{k.short}常見問題</h2>
          <div className="flex flex-col gap-5">
            {k.faq.map((f, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--oak)' }}>{f.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(251,249,244,0.65)' }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross links */}
        <section className="mb-12">
          <h2 className="text-xs tracking-[.2em] uppercase mb-4" style={{ color: 'rgba(251,249,244,0.4)' }}>其他地區與服務</h2>
          <div className="flex flex-wrap gap-2">
            {otherCombos.map(([ct, cat]) => (
              <Link key={`${ct}-${cat}`} href={`/local/${ct}/${cat}`}
                className="rounded-full px-4 py-1.5 text-xs"
                style={{ border: '1px solid rgba(166,137,102,0.3)', color: 'rgba(251,249,244,0.6)' }}>
                {CITIES[ct].name}{CATEGORIES[cat].short}
              </Link>
            ))}
          </div>
        </section>

        {/* Provider CTA */}
        <section className="rounded-2xl p-6 text-center" style={{ background: 'rgba(166,137,102,0.1)', border: '1px solid rgba(166,137,102,0.25)' }}>
          <p className="font-display text-lg mb-2" style={{ color: 'var(--cream)' }}>你是{c.name}的{k.name}嗎？</p>
          <p className="text-sm mb-4" style={{ color: 'rgba(251,249,244,0.65)' }}>
            加入 MooLah，讓客人在 LINE 直接預約你的時段。14 天免費試用、免綁約。
          </p>
          <Link href="/join" className="inline-block rounded-full px-6 py-2.5 text-sm"
            style={{ background: 'var(--oak)', color: 'var(--charcoal-deep)' }}>
            了解合作方案
          </Link>
        </section>
      </main>
    </div>
  )
}
