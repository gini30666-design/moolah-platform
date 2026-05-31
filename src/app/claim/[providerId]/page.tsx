'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import liff from '@line/liff'

type Stage = 'loading' | 'confirming' | 'claiming' | 'success' | 'already_claimed' | 'already_owner' | 'not_found' | 'error'

const oak = '#A68966'
const cream = '#fbf9f4'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'

export default function ClaimPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('loading')
  const [providerName, setProviderName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pictureUrl, setPictureUrl] = useState('')
  const [lineUserId, setLineUserId] = useState('')

  useEffect(() => {
    async function init() {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href })
          return
        }

        const [profile, providerRes] = await Promise.all([
          liff.getProfile(),
          fetch(`/api/provider/${providerId}`),
        ])

        setDisplayName(profile.displayName)
        setPictureUrl(profile.pictureUrl ?? '')
        setLineUserId(profile.userId)

        if (!providerRes.ok) { setStage('not_found'); return }
        const data = await providerRes.json()
        if (!data.provider) { setStage('not_found'); return }

        setProviderName(data.provider.storeName || data.provider.name)
        setStage('confirming')
      } catch {
        setStage('error')
      }
    }
    init()
  }, [providerId])

  async function handleClaim() {
    setStage('claiming')
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, lineUserId }),
      })
      const data = await res.json()

      if (data.alreadyClaimed) { setStage('already_claimed'); return }
      if (data.alreadyOwner)   { setStage('already_owner');   return }
      if (data.success)        { setStage('success');         return }
      setStage('error')
    } catch {
      setStage('error')
    }
  }

  return (
    <div style={{ minHeight: '100svh', background: charcoalDeep, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: 'var(--font-plus-jakarta), var(--font-dm-sans), sans-serif' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }`}</style>

      {/* Logo */}
      <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: oak, textTransform: 'uppercase', marginBottom: '40px', opacity: 0.8 }}>MooLah</p>

      <div style={{ width: '100%', maxWidth: '360px', animation: 'fadeUp 0.5s ease both' }}>

        {/* ── Loading ── */}
        {stage === 'loading' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: `2px solid rgba(166,137,102,0.2)`, borderTop: `2px solid ${oak}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ color: 'rgba(251,249,244,0.4)', fontSize: '13px' }}>驗證中…</p>
          </div>
        )}

        {/* ── Confirming ── */}
        {stage === 'confirming' && (
          <div style={{ background: 'rgba(251,249,244,0.04)', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '24px', padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 20px' }}>
              {pictureUrl
                ? <img src={pictureUrl} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${oak}` }} />
                : <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `rgba(166,137,102,0.15)`, border: `2px solid ${oak}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '28px', color: oak }}>✦</span>
                  </div>
              }
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', background: '#06C755', borderRadius: '50%', border: `2px solid ${charcoalDeep}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M10 2C5.582 2 2 5.088 2 8.9c0 2.477 1.338 4.685 3.43 6.125-.15.555-.544 2.013-.623 2.325-.1.388.143.385.3.28.123-.083 1.97-1.3 2.766-1.829.53.075 1.073.115 1.627.115C14.418 15.916 18 12.828 18 9.04 18 5.25 14.418 2 10 2Z" fill="white"/></svg>
              </div>
            </div>

            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: cream, marginBottom: '4px' }}>{displayName}</p>
            <p style={{ fontSize: '12px', color: 'rgba(251,249,244,0.4)', marginBottom: '24px' }}>LINE 帳號</p>

            <div style={{ height: '1px', background: 'rgba(166,137,102,0.15)', margin: '0 0 24px' }} />

            <p style={{ fontSize: '12px', color: 'rgba(251,249,244,0.55)', marginBottom: '6px' }}>綁定後台帳號</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.25rem', color: oak, marginBottom: '28px' }}>{providerName}</p>

            <button onClick={handleClaim} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: oak, color: cream, fontSize: '15px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em', boxShadow: '0 8px 24px rgba(166,137,102,0.3)' }}>
              確認綁定後台
            </button>
            <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.25)', marginTop: '14px', lineHeight: 1.6 }}>綁定後您可透過此 LINE 帳號登入後台管理預約</p>
          </div>
        )}

        {/* ── Claiming ── */}
        {stage === 'claiming' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: `2px solid rgba(166,137,102,0.2)`, borderTop: `2px solid ${oak}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'rgba(251,249,244,0.4)', fontSize: '13px' }}>綁定中…</p>
          </div>
        )}

        {/* ── Success ── */}
        {(stage === 'success' || stage === 'already_owner') && (
          <div style={{ background: 'rgba(251,249,244,0.04)', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '24px', padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(166,137,102,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `1px solid rgba(166,137,102,0.3)` }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: '28px', height: '28px' }}>
                <path d="M5 13l4 4L19 7" stroke={oak} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', fontWeight: 300, color: cream, marginBottom: '8px' }}>
              {stage === 'already_owner' ? '帳號已綁定' : '綁定成功'}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.45)', marginBottom: '28px', lineHeight: 1.6 }}>
              {stage === 'already_owner'
                ? '此 LINE 帳號已是後台擁有者'
                : `${providerName} 的後台已與您的 LINE 帳號連結`}
            </p>
            <button onClick={() => router.push('/dashboard')} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: oak, color: cream, fontSize: '15px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}>
              進入後台管理
            </button>
          </div>
        )}

        {/* ── Already Claimed ── */}
        {stage === 'already_claimed' && (
          <div style={{ background: 'rgba(251,249,244,0.04)', border: '1px solid rgba(200,80,80,0.3)', borderRadius: '24px', padding: '32px 28px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: cream, marginBottom: '8px' }}>此帳號已被認領</p>
            <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.45)', lineHeight: 1.6 }}>
              此頁面已由其他 LINE 帳號綁定。<br />如有問題請聯絡 MooLah 客服。
            </p>
            <a href="https://line.me/R/ti/p/@492ejbwx" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '20px', padding: '12px 24px', borderRadius: '12px', background: '#06C755', color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>聯絡 MooLah</a>
          </div>
        )}

        {/* ── Not Found ── */}
        {stage === 'not_found' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: cream, marginBottom: '8px' }}>找不到此頁面</p>
            <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.4)' }}>連結可能已失效，請聯絡 MooLah。</p>
          </div>
        )}

        {/* ── Error ── */}
        {stage === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: cream, marginBottom: '8px' }}>發生錯誤</p>
            <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.4)', marginBottom: '20px' }}>請重新整理，或聯絡 MooLah 客服。</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: '10px', border: `1px solid rgba(166,137,102,0.3)`, background: 'transparent', color: oak, fontSize: '13px', cursor: 'pointer' }}>重新整理</button>
          </div>
        )}

      </div>

      <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.15)', marginTop: '48px', letterSpacing: '0.08em' }}>MooLah · 永翔數位有限公司</p>
    </div>
  )
}
