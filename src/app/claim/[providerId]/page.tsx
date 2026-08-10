'use client'
import { useEffect, useState } from 'react'
import LineLink from '@/components/LineLink'
import { OA_B2B } from '@/lib/lineOA'
import { useParams, useRouter } from 'next/navigation'
import liff from '@line/liff'
import OpenInLine from '@/components/OpenInLine'

type Stage = 'loading' | 'need_line' | 'confirming' | 'claiming' | 'success' | 'already_claimed' | 'already_owner' | 'not_found' | 'error'

const CONTRACT_TERMS = `合作服務條款

一、服務說明
MooLah 為職人提供線上預約管理系統，包含個人頁面、時段管理、LINE 雙向通知及後台管理。

二、方案與試用
新加入享 14 天免費試用（全功能，試用期間預約上限 30 筆）。試用期滿轉標準方案 NT$699／月；不需試用者可直接正式加入。工作室方案依規模另行報價。客製立牌於正式加入後免費提供。試用期滿未續約，後台暫停、資料保留 30 天。MooLah 保留依市場調整定價之權利，並提前 30 天通知。

三、付款方式
每月月結，收到付款通知後 5 個工作日內完成匯款。逾期未繳將暫停後台服務，惟已受理之預約不受影響。

四、合作終止
任一方得提前 30 天書面通知終止合作。終止後，MooLah 將於 7 個工作日內移除您的個人頁面及資料。

五、資料使用
您的 LINE 帳號與聯絡資訊僅供 MooLah 平台運作及通知使用，不對外出售或提供。您的客戶資料由您自行管理，MooLah 僅作為平台工具。

六、著作權
您上傳之作品集照片著作權歸您所有，MooLah 僅在平台範圍內展示使用。您授予 MooLah 非獨家展示授權，於合作期間有效。

七、責任限制
MooLah 對因不可抗力（天災、網路中斷、LINE 平台故障）造成之服務中斷不負賠償責任。

八、準據法
本條款依中華民國法律解釋，爭議以高雄地方法院為第一審管轄法院。

如有疑問請聯絡：service@moolah.studio`

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
  const [agreed, setAgreed] = useState(false)
  const [direct, setDirect] = useState(false)   // ?direct=1 = 跳過試用、直接正式加入
  const [presetPlan, setPresetPlan] = useState('')  // OB 上線時已指定的方案（active/trial/空）
  const [hasAvatar, setHasAvatar] = useState(false)
  const [hasInstagram, setHasInstagram] = useState(false)
  const [hasPortfolio, setHasPortfolio] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const isDirect = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('direct') === '1'
        setDirect(isDirect)
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

        if (!liff.isLoggedIn()) {
          // 🔴 2026-08-10：在「外部瀏覽器」自動導去 /dashboard 會造成無限跳轉。
          // 機制：/dashboard 呼叫 liff.login() → 外部瀏覽器會去喚起 LINE App 認證
          //      → LINE 跳回瀏覽器 → 又進 /dashboard → 又 login → 死循環。
          // （Zuzu 實機遇到，螢幕錄影確認）
          // 只有「已經在 LINE 裡」時走 /dashboard 轉接才安全（那裡是註冊過的 callback URL）。
          if (!liff.isInClient()) {
            setStage('need_line')
            return
          }
          // /claim/ is not a registered callback URL in LINE Login channel.
          // Route through /dashboard (which is registered) and use ?to= to return here.
          // 保住 direct 參數（跳過試用）跨過 LIFF 登入轉址
          const back = `/claim/${providerId}${isDirect ? '?direct=1' : ''}`
          window.location.href = `/dashboard?to=${encodeURIComponent(back)}`
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
        setPresetPlan((data.provider.plan ?? '').trim())
        setHasAvatar(!!(data.provider.avatarUrl ?? '').trim())
        setHasInstagram(!!(data.provider.instagram ?? '').trim())
        setHasPortfolio((data.portfolio ?? []).length > 0)
        setStage('confirming')
      } catch {
        setStage('error')
      }
    }
    init()
  }, [providerId])

  // 只列實際還缺的項目（OB 代填的職人多半全齊 → 陣列為空 → 顯示完成版）
  const todoSteps = [
    !hasAvatar && { n: '1', title: '補上頭像', desc: '進後台上方頭像區編輯' },
    !hasPortfolio && { n: '2', title: '上傳環境或作品照', desc: '傳 LINE 給我們，我們幫你上架' },
    !hasInstagram && { n: '3', title: '補上 IG 帳號', desc: '客人可以直接點進你的作品' },
  ].filter(Boolean).map((x, i) => ({ ...(x as { n: string; title: string; desc: string }), n: String(i + 1) }))

  async function handleClaim() {
    setStage('claiming')
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, lineUserId, agreedAt: new Date().toISOString(), direct }),
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

  // 外部瀏覽器開啟 → 給按鈕讓使用者主動回 LINE，不自動跳（會死循環）
  if (stage === 'need_line') {
    return (
      <OpenInLine
        path={`/claim/${providerId}${direct ? '?direct=1' : ''}`}
        hint={'綁定後台需要確認你的 LINE 身分，\n請按下方按鈕在 LINE 中繼續。'}
      />
    )
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
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.25rem', color: oak, marginBottom: '16px' }}>{providerName}</p>

            {/* 方案徽章 */}
            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '999px', background: 'rgba(166,137,102,0.14)', border: '1px solid rgba(166,137,102,0.35)', marginBottom: '24px' }}>
              {/* 徽章必須反映這位職人「實際」的方案：OB 已設 active 的人若看到
                  「上限 30 筆」會被誤導（他其實沒有上限）。費用細節由業務個別談定，
                  這裡不叫價（與後台對帳面板一致）。 */}
              <span style={{ fontSize: '12px', color: oak, fontWeight: 600 }}>
                {presetPlan === 'active' || direct
                  ? '正式合作 · 0% 抽佣・不綁約'
                  : '14 天免費試用 · 全功能・上限 30 筆預約'}
              </span>
            </div>

            {/* Contract Terms */}
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.4)', marginBottom: '8px', letterSpacing: '0.05em' }}>合作服務條款</p>
              <div style={{
                height: '160px',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(166,137,102,0.15)',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '11px',
                lineHeight: '1.8',
                color: 'rgba(251,249,244,0.55)',
                whiteSpace: 'pre-line',
                WebkitOverflowScrolling: 'touch',
              }}>
                {CONTRACT_TERMS}
              </div>
            </div>

            {/* Agree Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left', marginBottom: '20px', minHeight: '44px', padding: '4px 0' }}>
              <div
                onClick={() => setAgreed(v => !v)}
                style={{
                  flexShrink: 0,
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: agreed ? `2px solid ${oak}` : '2px solid rgba(166,137,102,0.35)',
                  background: agreed ? oak : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                {agreed && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke={cream} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span onClick={() => setAgreed(v => !v)} style={{ fontSize: '12px', color: 'rgba(251,249,244,0.6)', lineHeight: 1.6 }}>
                我已閱讀並同意上述<span style={{ color: oak }}>合作服務條款</span>
              </span>
            </label>

            <button
              onClick={handleClaim}
              disabled={!agreed}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                background: agreed ? oak : 'rgba(166,137,102,0.25)',
                color: agreed ? cream : 'rgba(251,249,244,0.3)',
                fontSize: '15px',
                fontWeight: 600,
                cursor: agreed ? 'pointer' : 'not-allowed',
                letterSpacing: '0.04em',
                boxShadow: agreed ? '0 8px 24px rgba(166,137,102,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {presetPlan === 'active' || direct ? '確認並綁定後台' : '開始 14 天免費試用'}
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
            <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.45)', marginBottom: '24px', lineHeight: 1.6 }}>
              {stage === 'already_owner'
                ? '此 LINE 帳號已是後台擁有者'
                : `${providerName} 的後台已與您的 LINE 帳號連結`}
            </p>

            {/* 3-step walkthrough — only for fresh claim */}
            {stage === 'success' && (
              <div style={{ textAlign: 'left', marginBottom: '24px', padding: '16px 14px', background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '14px' }}>
                {/* 由 MooLah 代為建置的職人（OB 流程）通常頭像／作品／IG 都已備妥，
                    不該還叫他「補上頭像」。這裡只列出實際還缺的項目。 */}
                <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: oak, textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                  {todoSteps.length > 0 ? '接下來' : '你的頁面已經準備好了'}
                </p>
                {todoSteps.map((s) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: oak, color: cream, fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>{s.n}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12.5px', color: cream, fontWeight: 600, marginBottom: '2px', letterSpacing: '0.02em' }}>{s.title}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.48)', lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
                {todoSteps.length === 0 && (
                  <p style={{ fontSize: '11.5px', color: 'rgba(251,249,244,0.6)', lineHeight: 1.7, textAlign: 'center' }}>
                    服務項目、環境照與可預約時段都已設定完成。<br />
                    進後台按「分享預約連結」就能開始接單。
                  </p>
                )}
                <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.32)', marginTop: '10px', lineHeight: 1.6, textAlign: 'center' }}>※ 要新增或修改照片，傳 LINE 給我們就好</p>
              </div>
            )}

            <button onClick={() => router.push('/dashboard')} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: oak, color: cream, fontSize: '15px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}>
              進入後台管理
            </button>
            <a href={`/contract/${providerId}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12px', color: 'rgba(251,249,244,0.55)', textDecoration: 'none', borderBottom: '1px solid rgba(251,249,244,0.2)', paddingBottom: '2px' }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '12px', height: '12px' }}>
                <path d="M3 1.5h7l3 3v10H3z"/><path d="M10 1.5v3h3M5 8h6M5 11h6"/>
              </svg>
              下載合約 PDF（可留底存證）
            </a>
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
            <LineLink source="claim_1" oaId={OA_B2B} track style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '20px', padding: '12px 24px', borderRadius: '12px', background: '#06C755', color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>聯絡 MooLah</LineLink>
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
