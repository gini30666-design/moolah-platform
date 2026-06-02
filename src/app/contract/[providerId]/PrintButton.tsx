'use client'

export default function PrintButton() {
  return (
    <div className="no-print" style={{ marginTop: '32px', textAlign: 'center' }}>
      <button
        onClick={() => window.print()}
        type="button"
        style={{ padding: '12px 28px', borderRadius: '8px', background: '#A68966', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        下載 / 列印 PDF
      </button>
      <p style={{ fontSize: '11px', color: '#9a8e83', marginTop: '10px' }}>瀏覽器列印對話框中選「儲存為 PDF」即可</p>
    </div>
  )
}
