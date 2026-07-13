// 價值主張列（取代早期即時統計：小數字自曝其短且違反「不像剛起步公司」定位；改用不會過期的真實承諾）
const ITEMS = [
  { title: '一鍵預約', caption: 'LINE 原生・免下載' },
  { title: '雙向提醒', caption: '預約與變動即時通知' },
  { title: '嚴選職人', caption: '專業審核後合作' },
]

export default function TrustBar() {
  return (
    <div
      style={{
        background: 'rgba(166,137,102,0.08)',
        borderTop: '1px solid rgba(166,137,102,0.18)',
        borderBottom: '1px solid rgba(166,137,102,0.18)',
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        {ITEMS.map(it => (
          <div key={it.title}>
            <p
              className="font-display"
              style={{
                fontSize: 'clamp(1.15rem,2.4vw,1.5rem)',
                color: '#8a6d48',
                fontWeight: 400,
                lineHeight: 1.2,
                letterSpacing: '0.04em',
                marginBottom: '4px',
              }}
            >
              {it.title}
            </p>
            <p
              style={{
                fontSize: '11px',
                color: '#6f6659',
                letterSpacing: '0.12em',
              }}
            >
              {it.caption}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
