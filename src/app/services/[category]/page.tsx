import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSheetData } from '@/lib/sheets'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

// 類別 slug → 中文名稱 + SEO meta
const CATEGORY_MAP: Record<string, {
  zh: string
  en: string
  emoji: string
  title: string
  description: string
  hero: string
  intro: string
  benefits: string[]
  faq: { q: string; a: string }[]
}> = {
  'hair-stylist': {
    zh: '髮型設計師',
    en: 'Hair Designer',
    emoji: '✂️',
    title: '台灣髮型設計師線上預約 | LINE 一鍵預約剪髮染髮燙髮',
    description: '台灣髮型設計師線上預約平台。高雄、台北、台中、台南專業髮型師，剪髮、染髮、燙髮、護髮，透過 LINE 一鍵預約，不需下載 App。',
    hero: '剪一個你會想自拍的髮型',
    intro: 'MooLah 為你媒合台灣頂尖髮型設計師。從剪髮、染髮、燙髮到深層護髮，每位設計師都附完整作品集與真實客戶評價，透過 LINE 一鍵預約，全程不需下載 App。',
    benefits: [
      '所有設計師都附作品集 + 客戶評價',
      '不用下載 App，加 LINE 即可預約',
      '前一天系統自動 LINE 提醒，絕不漏約',
      '取消、改期、查詢預約都在 LINE 完成',
    ],
    faq: [
      { q: '預約後可以取消嗎？', a: '可以。進入「我的預約」找到該筆，點「取消預約」即可。建議至少提前 2 小時取消，讓設計師能安排其他客人。' },
      { q: '費用怎麼算？', a: '所有服務費用在預約頁明確標示。MooLah 不收任何手續費，到店後由設計師直接收取。' },
      { q: '設計師專業嗎？', a: '每位合作設計師都需通過 MooLah 審核才能上線。可以查看作品集、客戶評價、星等做判斷。' },
    ],
  },
  'pet-grooming': {
    zh: '寵物美容師',
    en: 'Pet Grooming',
    emoji: '🐶',
    title: '台灣寵物美容師線上預約 | 狗狗貓貓 LINE 一鍵預約洗澡剪毛',
    description: '台灣寵物美容師線上預約平台。狗狗、貓貓專業美容師，洗澡、剪毛、SPA、護理，透過 LINE 一鍵預約，多隻同時服務可備註。',
    hero: '讓你家毛孩優雅出門',
    intro: 'MooLah 嚴選台灣寵物美容師。從基礎洗澡、剪毛造型到深層護理 SPA，每位美容師都熟悉狗貓性格與品種需求。透過 LINE 一鍵預約。',
    benefits: [
      '可備註毛孩品種、毛色、特殊需求',
      '多隻寵物可同時預約連續時段',
      '美容師會回傳服務前後對比照',
      '預約完成後 LINE 雙向通知，安心又方便',
    ],
    faq: [
      { q: '可以一次帶兩隻寵物嗎？', a: '可以。預約備註欄請註明「2 隻狗」或「1 狗 1 貓」，美容師會安排足夠時段。' },
      { q: '對皮膚敏感的毛孩有特別處理嗎？', a: '預約時可選擇低敏服務或備註過敏狀況，美容師會使用對應產品。' },
      { q: '如果毛孩很緊張怎麼辦？', a: 'MooLah 合作美容師大多有處理緊張毛孩的經驗，預約備註欄請說明，美容師會放慢節奏。' },
    ],
  },
  'auto-detailing': {
    zh: '汽車美容師',
    en: 'Auto Detailing',
    emoji: '🚗',
    title: '台灣汽車美容師線上預約 | LINE 一鍵預約洗車打蠟鍍膜',
    description: '台灣汽車美容師線上預約平台。專業洗車、打蠟、鍍膜、內裝清潔，透過 LINE 一鍵預約，可指定到府服務或店面。',
    hero: '讓你的車跟新的一樣',
    intro: 'MooLah 媒合台灣專業汽車美容師。從手洗洗車、深度去汙、打蠟、鍍膜到內裝精緻清潔，每位美容師都附作品集與客戶評價。',
    benefits: [
      '可選店面服務或到府服務（看設計師）',
      '不同車型有對應價格表',
      '完工 LINE 推播 + 對比照記錄',
      '車主可上傳目前車況讓美容師預估',
    ],
    faq: [
      { q: '會傷到車漆嗎？', a: 'MooLah 合作美容師都使用專業級工具與藥劑，預約前可在備註欄詢問使用品牌。' },
      { q: '一台車要多久？', a: '看項目。基本洗車 60 分鐘、打蠟 120 分鐘、深度鍍膜 4-6 小時。預約頁會標示時長。' },
      { q: '可以到府服務嗎？', a: '部分美容師有提供到府，請在設計師個人頁查看是否標示「到府服務」。' },
    ],
  },
  'nail': {
    zh: '美甲師',
    en: 'Nail Artist',
    emoji: '💅',
    title: '台灣美甲師線上預約 | LINE 一鍵預約凝膠光療美甲款式',
    description: '台灣美甲師線上預約平台。凝膠、光療、卸甲、彩繪、貼鑽，透過 LINE 一鍵預約，可附參考圖讓美甲師預先準備。',
    hero: '把指尖變成藝術',
    intro: 'MooLah 嚴選台灣美甲師。凝膠光療、彩繪設計、卸甲護理，每位美甲師都附完整作品集，可挑款式後直接預約。',
    benefits: [
      '預約備註可附參考圖讓美甲師預準備',
      '作品集分款式檢索（裸色、彩繪、貼鑽…）',
      '系統會記錄你上次做的款式',
      '預約即時 LINE 確認，前一天提醒',
    ],
    faq: [
      { q: '可以指定款式嗎？', a: '可以。預約備註欄可貼參考圖連結，或在「靈感參考」選美甲師作品集中的款式。' },
      { q: '卸甲要另外算嗎？', a: '看美甲師。預約頁會清楚標示是否含卸甲，部分美甲師服務內已含。' },
      { q: '有手部護理服務嗎？', a: '部分美甲師提供手部 SPA 與護膚服務，請看設計師個人頁的服務列表。' },
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const cat = CATEGORY_MAP[category]
  if (!cat) return { title: 'MooLah' }
  return {
    title: cat.title,
    description: cat.description,
    alternates: {
      canonical: `${BASE_URL}/services/${category}`,
    },
    openGraph: {
      title: `${cat.zh} | MooLah`,
      description: cat.description,
      url: `${BASE_URL}/services/${category}`,
    },
  }
}

export default async function CategoryLanding({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const cat = CATEGORY_MAP[category]
  if (!cat) return notFound()

  const providerRows = await getSheetData('providers!A2:T')
  const providers = providerRows
    .filter(r => r[2] === cat.zh)
    .slice(0, 8)
    .map(r => ({
      id: r[0] as string,
      name: r[1] as string,
      storeName: (r[6] as string) ?? '',
      district: (r[8] as string) ?? '',
      rating: (r[14] as string) ?? '',
      reviewCount: (r[15] as string) ?? '',
      tagline: (r[17] as string) ?? '',
    }))

  return (
    <>
      <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        {/* Hero */}
        <section style={{ background: 'var(--charcoal-deep)', padding: '100px 24px 70px', textAlign: 'center', color: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <p style={{ fontSize: 60, marginBottom: 18 }}>{cat.emoji}</p>
          <p style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--oak)', textTransform: 'uppercase', marginBottom: 16 }}>{cat.en}</p>
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem,6vw,3.8rem)', fontWeight: 300, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.01em' }}>{cat.hero}</h1>
          <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: 'rgba(251,249,244,0.65)', maxWidth: 640, margin: '0 auto', lineHeight: 1.8 }}>{cat.intro}</p>
          <Link href={`/discover?category=${encodeURIComponent(cat.zh)}`}
            style={{ display: 'inline-block', marginTop: 32, padding: '14px 36px', background: 'var(--oak)', color: 'var(--cream)', borderRadius: 8, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600 }}>
            探索 {cat.zh} →
          </Link>
        </section>

        {/* Benefits */}
        <section style={{ padding: '60px 24px', maxWidth: 980, margin: '0 auto' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--charcoal)', fontWeight: 400, textAlign: 'center', marginBottom: 36 }}>為什麼選 MooLah</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {cat.benefits.map((b, i) => (
              <div key={i} style={{ background: 'white', padding: '20px 22px', borderRadius: 14, border: '1px solid rgba(166,137,102,0.18)' }}>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 22, color: 'var(--oak)', marginBottom: 8 }}>0{i + 1}</p>
                <p style={{ fontSize: 14, color: 'var(--charcoal)', lineHeight: 1.7 }}>{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Provider preview */}
        {providers.length > 0 && (
          <section style={{ padding: '40px 24px 60px', maxWidth: 980, margin: '0 auto' }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--charcoal)', fontWeight: 400, textAlign: 'center', marginBottom: 8 }}>合作 {cat.zh}</h2>
            <p style={{ fontSize: 13, color: 'rgba(44,40,37,0.55)', textAlign: 'center', marginBottom: 28 }}>共 {providers.length} 位精選職人</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {providers.map(p => (
                <Link key={p.id} href={`/${p.id}`} style={{ background: 'white', padding: '18px 20px', borderRadius: 14, border: '1px solid rgba(166,137,102,0.22)', textDecoration: 'none', display: 'block' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>{p.storeName || p.name}</p>
                  {p.storeName && <p style={{ fontSize: 12, color: 'rgba(44,40,37,0.5)', marginBottom: 8 }}>{p.name}</p>}
                  {p.rating && <p style={{ fontSize: 12, color: 'var(--oak)', marginBottom: 6 }}>★ {p.rating}{p.reviewCount && ` (${p.reviewCount})`}</p>}
                  {p.tagline && <p style={{ fontSize: 12, color: 'rgba(44,40,37,0.55)', fontStyle: 'italic', lineHeight: 1.6 }}>「{p.tagline}」</p>}
                  {p.district && <p style={{ fontSize: 11, color: 'rgba(44,40,37,0.4)', marginTop: 8 }}>📍 {p.district}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section style={{ padding: '40px 24px 80px', maxWidth: 760, margin: '0 auto' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--charcoal)', fontWeight: 400, textAlign: 'center', marginBottom: 28 }}>常見問題</h2>
          {cat.faq.map((f, i) => (
            <details key={i} style={{ background: 'white', borderRadius: 12, marginBottom: 10, padding: '14px 20px', border: '1px solid rgba(166,137,102,0.18)' }}>
              <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', listStyle: 'none' }}>{f.q}</summary>
              <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(44,40,37,0.7)', lineHeight: 1.8 }}>{f.a}</p>
            </details>
          ))}
        </section>

        {/* CTA */}
        <section style={{ background: 'var(--oak)', padding: '40px 24px', textAlign: 'center' }}>
          <p className="font-display" style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'var(--cream)', fontWeight: 400, marginBottom: 18 }}>準備好預約 {cat.zh} 了嗎？</p>
          <Link href={`/discover?category=${encodeURIComponent(cat.zh)}`}
            style={{ display: 'inline-block', padding: '12px 30px', background: 'var(--charcoal)', color: 'var(--cream)', borderRadius: 8, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600 }}>
            開始探索 →
          </Link>
        </section>

        {/* Footer */}
        <footer style={{ padding: '24px', textAlign: 'center', background: 'var(--charcoal-deep)', color: 'var(--oak-dim)', fontSize: 12 }}>
          <p>© 2026 永翔數位有限公司 MooLah · <Link href="/" style={{ color: 'var(--oak)', textDecoration: 'none' }}>回首頁</Link></p>
        </footer>
      </main>
    </>
  )
}
