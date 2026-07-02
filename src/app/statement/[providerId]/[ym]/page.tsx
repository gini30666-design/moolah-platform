import { getSheetData } from '@/lib/sheets'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

// 從 YYYY-MM 字串計算月份起迄日
function getMonthRange(ym: string): { from: string; to: string; label: string } | null {
  const m = ym.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const year = parseInt(m[1])
  const month = parseInt(m[2])
  if (month < 1 || month > 12) return null
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${String(month).padStart(2,'0')}-01`,
    to: `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`,
    label: `${year} 年 ${month} 月`,
  }
}

export default async function StatementPage({ params }: { params: Promise<{ providerId: string; ym: string }> }) {
  const { providerId, ym } = await params
  const range = getMonthRange(ym)

  if (!range) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>無效的月份格式（需 YYYY-MM）</div>
  }

  const [providerRows, bookingRows, serviceRows] = await Promise.all([
    getSheetData('providers!A2:U'),
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
  ])

  const provider = providerRows.find(r => r[0] === providerId)
  if (!provider) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>找不到此設計師</div>
  }

  const providerName = (provider[1] as string) ?? ''
  const storeName = (provider[6] as string) ?? ''

  // 該月所有預約（不分 status）
  const monthBookings = bookingRows.filter(r =>
    r[1] === providerId && (r[5] as string) >= range.from && (r[5] as string) <= range.to
  )

  const confirmedOrCompleted = monthBookings.filter(r => (r[12] ?? '') !== 'cancelled' && (r[12] ?? '') !== 'no_show')
  const noShows = monthBookings.filter(r => (r[12] as string) === 'no_show')
  const cancelled = monthBookings.filter(r => (r[12] as string) === 'cancelled')

  // 營收計算（含 confirmed/completed，no_show & cancelled 不計）
  const revenue = confirmedOrCompleted.reduce((sum, r) => {
    const svc = serviceRows.find(s => s[0] === providerId && s[1] === r[2])
    return sum + (svc ? Number(svc[3]) : 0)
  }, 0)

  // 按服務分類統計
  const serviceBreakdown: Record<string, { count: number; revenue: number }> = {}
  for (const r of confirmedOrCompleted) {
    const svc = serviceRows.find(s => s[0] === providerId && s[1] === r[2])
    const name = (svc?.[2] as string) ?? '其他'
    const price = svc ? Number(svc[3]) : 0
    if (!serviceBreakdown[name]) serviceBreakdown[name] = { count: 0, revenue: 0 }
    serviceBreakdown[name].count++
    serviceBreakdown[name].revenue += price
  }

  const MONTHLY_FEE = 699

  return (
    <>
      <style>{`
        @page { size: A4; margin: 22mm 20mm; }
        body { background: #f5f5f0; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      <div style={{ maxWidth: '720px', margin: '20px auto', padding: '48px 56px', background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', fontFamily: '"Noto Serif TC", "Songti SC", serif', color: '#2C2825', lineHeight: 1.8 }} className="page">

        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #A68966', paddingBottom: '20px', marginBottom: '28px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.3em', color: '#A68966', textTransform: 'uppercase', marginBottom: '8px' }}>MooLah · 月度對帳單</p>
          <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#2C2825', margin: 0 }}>{range.label} 對帳單</h1>
          <p style={{ fontSize: '13px', color: '#7a6f65', marginTop: '6px' }}>{storeName || providerName}{storeName && providerName ? `（${providerName}）` : ''}</p>
        </div>

        {/* 核心數字 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '30px' }}>
          {[
            { label: '成交筆數', value: confirmedOrCompleted.length.toString(), unit: '筆' },
            { label: '本月營收', value: `NT$ ${revenue.toLocaleString()}`, unit: '' },
            { label: '平台月費', value: `NT$ ${MONTHLY_FEE.toLocaleString()}`, unit: '' },
          ].map(s => (
            <div key={s.label} style={{ padding: '20px 16px', background: '#faf7f2', borderRadius: '10px', textAlign: 'center', border: '1px solid #e8dfd3' }}>
              <p style={{ fontSize: '11px', color: '#7a6f65', letterSpacing: '0.06em', marginBottom: '8px' }}>{s.label}</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '24px', color: '#2C2825', fontWeight: 400, margin: 0 }}>{s.value}{s.unit}</p>
            </div>
          ))}
        </div>

        {/* 詳細統計表 */}
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C2825', marginBottom: '12px', borderLeft: '3px solid #A68966', paddingLeft: '12px' }}>本月狀態統計</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
          <tbody>
            <tr><td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3', color: '#555' }}>已完成 / 確認</td><td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3', textAlign: 'right', fontWeight: 600 }}>{confirmedOrCompleted.length} 筆</td></tr>
            <tr><td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3', color: '#555' }}>取消</td><td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3', textAlign: 'right' }}>{cancelled.length} 筆</td></tr>
            <tr><td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3', color: '#c25' }}>No-show</td><td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3', textAlign: 'right', color: '#c25' }}>{noShows.length} 筆</td></tr>
            <tr><td style={{ padding: '10px 14px', color: '#555', fontWeight: 600 }}>本月總預約數</td><td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{monthBookings.length} 筆</td></tr>
          </tbody>
        </table>

        {/* 服務分項 */}
        {Object.keys(serviceBreakdown).length > 0 && (
          <>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C2825', marginBottom: '12px', borderLeft: '3px solid #A68966', paddingLeft: '12px' }}>服務項目分析</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px', background: '#2C2825', color: '#fbf9f4', textAlign: 'left', fontWeight: 600 }}>服務</th>
                  <th style={{ padding: '10px 14px', background: '#2C2825', color: '#fbf9f4', textAlign: 'right', fontWeight: 600 }}>次數</th>
                  <th style={{ padding: '10px 14px', background: '#2C2825', color: '#fbf9f4', textAlign: 'right', fontWeight: 600 }}>營收 NT$</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(serviceBreakdown)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([name, s]) => (
                    <tr key={name}>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3' }}>{name}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3', textAlign: 'right' }}>{s.count}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8dfd3', textAlign: 'right', fontWeight: 600 }}>{s.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        )}

        {/* 對帳訊息 */}
        <div style={{ marginTop: '30px', padding: '18px 22px', background: '#faf7f2', borderRadius: '8px', borderLeft: '4px solid #A68966' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#A68966', letterSpacing: '0.12em', marginBottom: '8px' }}>應付對帳</p>
          <p style={{ fontSize: '15px', color: '#2C2825', marginBottom: '6px' }}>本月應付 MooLah 平台月費：<strong>NT$ {MONTHLY_FEE.toLocaleString()}</strong></p>
          <p style={{ fontSize: '12px', color: '#7a6f65', lineHeight: 1.6 }}>
            付款方式：銀行轉帳月結，請於收到對帳單後 5 個工作日內完成匯款。<br/>
            匯款資訊請參考合作合約，或聯絡 service@moolah.studio。
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e8dfd3', fontSize: '11px', color: '#9a8e83', textAlign: 'center', lineHeight: 1.7 }}>
          <p>本對帳單由 MooLah 平台自動生成 · 生成時間 {new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</p>
          <p style={{ marginTop: '6px' }}>MooLah · 永翔數位有限公司 · service@moolah.studio</p>
        </div>

        <PrintButton />
      </div>
    </>
  )
}
