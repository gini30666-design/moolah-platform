'use client'
import { useEffect, useState } from 'react'
import liff from '@line/liff'

export default function MyLineIdPage() {
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }).then(async () => {
      if (!liff.isLoggedIn()) { liff.login(); return }
      const profile = await liff.getProfile()
      setUserId(profile.userId)
      setName(profile.displayName)
    })
  }, [])

  function copy() {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fbf9f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: '12px', letterSpacing: '0.2em', color: '#A68966', marginBottom: '8px', textTransform: 'uppercase' }}>MooLah</p>
      <h1 style={{ fontSize: '22px', color: '#2C2825', marginBottom: '32px', fontWeight: 500 }}>
        {name ? `${name} 的 LINE ID` : '載入中...'}
      </h1>

      {userId && (
        <>
          <div style={{ background: 'white', border: '1px solid rgba(166,137,102,0.25)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', textAlign: 'center', width: '100%', maxWidth: '360px' }}>
            <p style={{ fontSize: '11px', color: '#A68966', marginBottom: '8px', letterSpacing: '0.1em' }}>USER ID</p>
            <p style={{ fontSize: '13px', color: '#2C2825', wordBreak: 'break-all', fontFamily: 'monospace' }}>{userId}</p>
          </div>
          <button
            onClick={copy}
            style={{ padding: '12px 32px', background: copied ? '#22b464' : '#2C2825', color: '#fbf9f4', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            {copied ? '已複製 ✓' : '複製 ID'}
          </button>
          <p style={{ marginTop: '20px', fontSize: '12px', color: 'rgba(44,40,37,0.45)', textAlign: 'center' }}>
            請將此 ID 截圖或複製後傳給 MooLah 管理員
          </p>
        </>
      )}
    </div>
  )
}
