'use client'

// 複製失敗時的最後出路：把網址顯示成「可選取」的欄位。
//
// ⚠️ 為什麼需要這個：
// 原本的 fallback 是 alert(`請長按下方網址複製：${url}`)——但 **iOS 的 alert 文字無法選取**，
// 所以那個提示實際上做不到，設計師還是拿不到連結。
// 連結拿不到 = 他招不到客人，這是後台最不能失敗的功能。
// （2026-08-08 複查時發現自己上一輪的 fallback 是假的）
import { useRef } from 'react'

export default function CopyableUrl({ url }: { url: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ marginTop: '10px' }}>
      <p style={{ fontSize: '11px', color: '#b45c5c', marginBottom: '6px' }}>
        自動複製失敗了，請點下方網址全選後手動複製：
      </p>
      <input
        ref={ref}
        readOnly
        value={url}
        onFocus={e => e.target.select()}
        onClick={() => ref.current?.select()}
        style={{
          width: '100%', padding: '10px 12px', fontSize: '12px',
          border: '1px solid rgba(166,137,102,0.4)', borderRadius: '10px',
          background: '#fff', color: '#2C2825', fontFamily: 'ui-monospace, monospace',
        }}
      />
    </div>
  )
}
