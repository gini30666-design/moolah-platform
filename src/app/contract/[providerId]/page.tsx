import { getSheetData } from '@/lib/sheets'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

const CONTRACT_TITLE = '永翔數位有限公司 — MooLah 合作服務條款'

const CLAUSES = [
  ['一、服務說明', 'MooLah 為職人提供線上預約管理系統，包含個人頁面、時段管理、LINE 雙向通知及後台管理。'],
  ['二、月費方案', '依所選方案收取固定月費（基礎方案 NT$0 / 專業方案 NT$599），MooLah 保留依市場調整定價之權利，並提前 30 天通知。'],
  ['三、付款方式', '每月月結，收到付款通知後 5 個工作日內完成匯款。逾期未繳將暫停後台服務，惟已受理之預約不受影響。'],
  ['四、合作終止', '任一方得提前 30 天書面通知終止合作。終止後，MooLah 將於 7 個工作日內移除您的個人頁面及資料。'],
  ['五、資料使用', '您的 LINE 帳號與聯絡資訊僅供 MooLah 平台運作及通知使用，不對外出售或提供。您的客戶資料由您自行管理，MooLah 僅作為平台工具。'],
  ['六、著作權', '您上傳之作品集照片著作權歸您所有，MooLah 僅在平台範圍內展示使用。您授予 MooLah 非獨家展示授權，於合作期間有效。'],
  ['七、責任限制', 'MooLah 對因不可抗力（天災、網路中斷、LINE 平台故障）造成之服務中斷不負賠償責任。'],
  ['八、準據法', '本條款依中華民國法律解釋，爭議以高雄地方法院為第一審管轄法院。'],
]

export default async function ContractPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params
  const rows = await getSheetData('providers!A2:U')
  const r = rows.find(row => row[0] === providerId)

  if (!r) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>找不到此合作夥伴</div>
  }

  const designerName = r[1] ?? ''
  const storeName = r[6] ?? ''
  const agreedAt = r[20] ?? ''
  const agreedDate = agreedAt
    ? new Date(agreedAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })
    : '—'

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
        <div style={{ textAlign: 'center', borderBottom: '2px solid #A68966', paddingBottom: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.3em', color: '#A68966', textTransform: 'uppercase', marginBottom: '8px' }}>MooLah · 合作合約</p>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#2C2825', margin: 0 }}>{CONTRACT_TITLE}</h1>
        </div>

        {/* Parties */}
        <div style={{ background: '#faf7f2', padding: '18px 22px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e8dfd3' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr><td style={{ width: '90px', color: '#7a6f65', paddingBottom: '6px' }}>甲方：</td><td style={{ paddingBottom: '6px' }}>永翔數位有限公司（MooLah 平台）</td></tr>
              <tr><td style={{ color: '#7a6f65', paddingBottom: '6px' }}>乙方：</td><td style={{ paddingBottom: '6px' }}>{designerName}{storeName && `（${storeName}）`}</td></tr>
              <tr><td style={{ color: '#7a6f65', paddingBottom: '6px' }}>簽署日期：</td><td style={{ paddingBottom: '6px' }}>{agreedDate}</td></tr>
              <tr><td style={{ color: '#7a6f65' }}>簽署方式：</td><td>線上電子簽署（Clickwrap）· UTC 時間 {agreedAt || '—'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Clauses */}
        {CLAUSES.map(([title, body]) => (
          <div key={title} style={{ marginBottom: '18px' }}>
            <p style={{ fontWeight: 600, fontSize: '15px', color: '#2C2825', marginBottom: '6px' }}>{title}</p>
            <p style={{ fontSize: '13.5px', color: '#3f3a35', textAlign: 'justify' }}>{body}</p>
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e8dfd3', fontSize: '11px', color: '#9a8e83', textAlign: 'center', lineHeight: 1.7 }}>
          <p>如有疑問請聯絡：moolah118@gmail.com · LINE OA @881zhkla</p>
          <p style={{ marginTop: '6px' }}>本合約由 MooLah 平台自動生成，乙方於上述時間點擊「我已閱讀並同意合作條款」即視為簽署</p>
        </div>

        {/* Print button (hidden on print) */}
        <PrintButton />
      </div>
    </>
  )
}
