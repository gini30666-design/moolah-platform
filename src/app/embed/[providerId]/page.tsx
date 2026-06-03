import { getSheetData } from '@/lib/sheets'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
]
const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function tt(t: string) { const [h,m] = t.split(':').map(Number); return h*60+m }

function todayTW() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function addDays(s: string, n: number) {
  const d = new Date(s + 'T12:00:00+08:00'); d.setDate(d.getDate() + n)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

async function getAvailableSlots(providerId: string, limit = 6) {
  const [bookingRows, availRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('availability!A2:F'),
  ])

  const provAvail = availRows.filter(r => r[0] === providerId)
  const blocks = provAvail.filter(r => r[1] === 'block').map(r => r[2])
  const scheduleRows = provAvail.filter(r => r[1] === 'schedule')

  const today = todayTW()
  const results: Array<{ date: string; time: string; label: string }> = []

  for (let offset = 0; offset < 14 && results.length < limit; offset++) {
    const dateStr = addDays(today, offset)
    if (blocks.includes(dateStr)) continue

    const dow = new Date(dateStr + 'T12:00:00+08:00').getDay()
    const daySched = scheduleRows.find(r => r[2] === DOW_NAMES[dow])
    if (daySched && daySched[5]?.toLowerCase() === 'false') continue

    const startMin = tt(daySched ? (daySched[3] || '09:00') : '09:00')
    const endMin = tt(daySched ? (daySched[4] || '19:00') : '19:00')

    const occupied = new Set<string>()
    for (const b of bookingRows) {
      if (b[1] === providerId && b[5] === dateStr && (b[12] ?? '') !== 'cancelled') {
        occupied.add(b[6] as string)
      }
    }

    for (const t of TIME_SLOTS) {
      if (results.length >= limit) break
      const m = tt(t)
      if (m < startMin || m >= endMin) continue
      if (occupied.has(t)) continue
      const d = new Date(dateStr + 'T12:00:00+08:00')
      const diff = Math.round((d.getTime() - new Date(today + 'T12:00:00+08:00').getTime()) / 86400000)
      const label = diff === 0 ? '今天' : diff === 1 ? '明天' : `${d.getMonth()+1}/${d.getDate()}（週${['日','一','二','三','四','五','六'][dow]}）`
      results.push({ date: dateStr, time: t, label })
    }
  }

  return results
}

export default async function EmbedPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params

  const [providerRows, serviceRows] = await Promise.all([
    getSheetData('providers!A2:T'),
    getSheetData('services!A2:F'),
  ])
  const provider = providerRows.find(r => r[0] === providerId)

  if (!provider) {
    return (
      <html lang="zh-Hant"><body style={{ fontFamily: 'sans-serif', padding: 40, textAlign: 'center', margin: 0 }}>
        找不到設計師
      </body></html>
    )
  }

  const name = (provider[1] as string) ?? ''
  const storeName = (provider[6] as string) ?? ''
  const rating = (provider[14] as string) ?? ''
  const reviewCount = (provider[15] as string) ?? ''
  const display = storeName || name

  const services = serviceRows.filter(r => r[0] === providerId)
  const minPrice = services.length > 0 ? Math.min(...services.map(s => Number(s[3]))) : 0

  const slots = await getAvailableSlots(providerId, 6)
  const bookingUrl = `${BASE_URL}/${providerId}/book`
  const profileUrl = `${BASE_URL}/${providerId}`

  return (
    <html lang="zh-Hant">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{display} · MooLah 預約</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: '"Noto Serif TC", -apple-system, BlinkMacSystemFont, sans-serif', background: '#fbf9f4' }}>
        <div style={{ maxWidth: 360, margin: '0 auto', padding: 16 }}>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#1a1714', color: '#fbf9f4', padding: '16px 18px', borderRadius: '14px 14px 0 0', borderBottom: '2px solid #A68966' }}>
              <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.28em', color: '#A68966', fontWeight: 600 }}>MOOLAH BOOKING</p>
              <p style={{ margin: '6px 0 2px', fontSize: 20, fontWeight: 600 }}>{display}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#bbb', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {rating && <span style={{ color: '#A68966' }}>★ {rating}{reviewCount && ` (${reviewCount})`}</span>}
                {minPrice > 0 && <span>NT$ {minPrice.toLocaleString()} 起</span>}
              </p>
            </div>
          </a>

          <div style={{ background: 'white', padding: '14px 16px', borderRadius: '0 0 14px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: '0.16em', color: '#A68966', fontWeight: 600 }}>最近可預約時段</p>
            {slots.length === 0 ? (
              <p style={{ margin: '12px 0', fontSize: 13, color: '#888', textAlign: 'center' }}>近 14 天暫無空檔，請進入查看更遠時段</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                {slots.map((s, i) => (
                  <a key={i} href={`${bookingUrl}?date=${s.date}`} target="_blank" rel="noopener noreferrer"
                     style={{ display: 'block', padding: '10px 8px', background: 'rgba(166,137,102,0.08)', border: '1px solid rgba(166,137,102,0.3)', borderRadius: 8, textAlign: 'center', textDecoration: 'none', color: '#2C2825' }}>
                    <p style={{ margin: 0, fontSize: 10, color: '#888' }}>{s.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#A68966' }}>{s.time}</p>
                  </a>
                ))}
              </div>
            )}
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
               style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#2C2825', color: '#fbf9f4', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.15em' }}>
              立即預約 →
            </a>
            <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 10, color: '#bbb' }}>Powered by MooLah</p>
          </div>
        </div>
      </body>
    </html>
  )
}
