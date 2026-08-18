'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import liff from '@line/liff'
import MoolahLoader from '@/components/MoolahLoader'
import OpenInLine from '@/components/OpenInLine'
import { authHeader } from '@/lib/clientAuth'

/**
 * 客服／協作夥伴用一次性邀請碼加入某個職人的後台。
 *
 * 與 /claim 的差別：claim 是「認領店的所有權」（寫 providers.line_user_id、簽合約），
 * 這裡只是「加進協作名單」（寫 provider_members），不簽約、不收 LINE 推播。
 *
 * ⚠️ 跟 /claim 同樣的坑：/join-team/ 不是 LINE Login 註冊過的 callback URL，
 *    未登入時必須經 /dashboard?to= 轉接，且外部瀏覽器不可自動跳（會無限迴圈）。
 */
type Stage = 'loading' | 'need_line' | 'confirming' | 'joining' | 'success' | 'invalid' | 'error'

const oak = '#a68966'
const cream = '#fbf9f4'
const charcoalDeep = '#1a1714'

const INVALID_TEXT: Record<string, { title: string; hint: string }> = {
  not_found: { title: '找不到這張邀請', hint: '連結可能打錯了，請跟店家要一條新的。' },
  used: { title: '這張邀請已經用過', hint: '每條邀請連結只能使用一次，請跟店家要一條新的。' },
  expired: { title: '這張邀請已過期', hint: '邀請連結 7 天內有效，請跟店家要一條新的。' },
}

export default function JoinTeamPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('loading')
  const [providerName, setProviderName] = useState('')
  const [providerId, setProviderId] = useState('')
  const [role, setRole] = useState<'manager' | 'staff'>('staff')
  const [displayName, setDisplayName] = useState('')
  const [pictureUrl, setPictureUrl] = useState('')
  const [invalidKind, setInvalidKind] = useState('not_found')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function init() {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

        if (!liff.isLoggedIn()) {
          if (!liff.isInClient()) { setStage('need_line'); return }
          window.location.href = `/dashboard?to=${encodeURIComponent(`/join-team/${code}`)}`
          return
        }

        const [profile, inviteRes] = await Promise.all([
          liff.getProfile(),
          fetch(`/api/team/join?code=${encodeURIComponent(code)}`),
        ])
        setDisplayName(profile.displayName)
        setPictureUrl(profile.pictureUrl ?? '')

        const data = await inviteRes.json().catch(() => ({}))
        if (!inviteRes.ok) {
          setInvalidKind(typeof data.status === 'string' ? data.status : 'not_found')
          setStage('invalid')
          return
        }
        setProviderId(data.providerId)
        setProviderName(data.providerName)
        setRole(data.role === 'manager' ? 'manager' : 'staff')
        setStage('confirming')
      } catch {
        setStage('error')
      }
    }
    init()
  }, [code])

  async function accept() {
    setStage('joining')
    setErrorMsg('')
    try {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ code, displayName }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.error === 'used' || data.error === 'expired' || data.error === 'not_found') {
          setInvalidKind(data.error)
          setStage('invalid')
          return
        }
        setErrorMsg('加入失敗，請稍後再試或跟店家要一條新的連結。')
        setStage('confirming')
        return
      }
      setProviderId(data.providerId)
      setStage('success')
    } catch {
      setErrorMsg('連線異常，請稍後再試。')
      setStage('confirming')
    }
  }

  if (stage === 'loading' || stage === 'joining') {
    return <MoolahLoader label={stage === 'joining' ? '加入中…' : '確認邀請中…'} />
  }
  if (stage === 'need_line') {
    return <OpenInLine path={`/join-team/${code}`} hint={'加入後台需要確認你的 LINE 身分，\n請按下方按鈕在 LINE 中繼續。'} />
  }

  const wrap = {
    minHeight: '100vh', background: charcoalDeep, color: cream,
    padding: '48px 22px', fontFamily: 'sans-serif',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  } as const
  const card = {
    background: 'rgba(251,249,244,0.04)', border: `1px solid rgba(166,137,102,0.2)`,
    borderRadius: '24px', padding: '32px 28px', textAlign: 'center',
  } as const

  if (stage === 'invalid' || stage === 'error') {
    const t = stage === 'error'
      ? { title: '連線異常', hint: '請重新整理頁面再試一次。' }
      : (INVALID_TEXT[invalidKind] ?? INVALID_TEXT.not_found)
    return (
      <div style={wrap}>
        <div style={card}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', fontWeight: 300, marginBottom: '10px' }}>{t.title}</p>
          <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.5)', lineHeight: 1.7 }}>{t.hint}</p>
        </div>
      </div>
    )
  }

  if (stage === 'success') {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(166,137,102,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `1px solid rgba(166,137,102,0.3)` }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '28px', height: '28px' }}>
              <path d="M5 13l4 4L19 7" stroke={oak} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', fontWeight: 300, marginBottom: '8px' }}>加入成功</p>
          <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.45)', marginBottom: '24px', lineHeight: 1.7 }}>
            你已經可以協助管理「{providerName}」的後台。
            <br />下次要進來，在 LINE 圖文選單按「我的後台」即可。
          </p>
          {/* 直接進這個 providerId 的後台，不繞 /dashboard（繞回去會被邀請頁再接一次） */}
          <button onClick={() => router.push(`/${providerId}/admin`)} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: oak, color: cream, fontSize: '15px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}>
            進入後台
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <p style={{ fontSize: '10px', letterSpacing: '0.24em', color: oak, textTransform: 'uppercase', marginBottom: '18px' }}>Team Invitation</p>

        {pictureUrl && (
          <img src={pictureUrl} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', display: 'block', border: `1px solid rgba(166,137,102,0.3)` }} />
        )}
        <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.55)', marginBottom: '4px' }}>{displayName}</p>

        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.55rem', fontWeight: 300, lineHeight: 1.5, marginTop: '14px', marginBottom: '10px' }}>
          你將協助管理<br />「{providerName}」的後台
        </p>

        <div style={{ textAlign: 'left', margin: '20px 0 24px', padding: '16px 14px', background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '14px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.16em', color: oak, textTransform: 'uppercase', marginBottom: '10px', fontWeight: 600 }}>
            {role === 'manager' ? '完整管理權限' : '接單協助權限'}
          </p>
          <p style={{ fontSize: '12.5px', color: 'rgba(251,249,244,0.62)', lineHeight: 1.8 }}>
            {role === 'manager'
              ? '可以查看與處理預約、手動建單、管理客戶備註，也可以調整服務項目、價格與排班。'
              : '可以查看與處理預約、手動建單、管理客戶備註與候補名單。不能更改服務價格與排班。'}
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.32)', marginTop: '10px', lineHeight: 1.7 }}>
            ※ 預約通知仍然只會發給店主本人，你不會收到 LINE 推播。
          </p>
        </div>

        {errorMsg && (
          <p style={{ fontSize: '12px', color: '#e6a08a', marginBottom: '12px', lineHeight: 1.6 }}>{errorMsg}</p>
        )}

        <button onClick={accept} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: oak, color: cream, fontSize: '15px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}>
          確認加入
        </button>
        <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.25)', marginTop: '14px', lineHeight: 1.6 }}>
          加入後店主可隨時在後台移除你的權限
        </p>
      </div>
    </div>
  )
}
