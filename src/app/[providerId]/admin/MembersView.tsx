'use client'
import { useCallback, useEffect, useState } from 'react'
import { authHeader } from '@/lib/clientAuth'
import { copyText } from '@/lib/clipboard'
import CopyableUrl from '@/components/CopyableUrl'
import { liffOpenUrl } from '@/components/OpenInLine'

/**
 * 後台「協作夥伴」——店主邀請客服／助理協助管理預約。
 *
 * 兩件事要清楚：
 * 1. 邀請連結是**憑證**，一次性、7 天到期，不能外流（所以名單只顯示 LINE ID 尾碼）。
 * 2. 協作夥伴**不會收到 LINE 推播** —— 預約通知永遠只發給店主本人。
 */
type Member = {
  lineUserId: string
  masked: string
  role: 'manager' | 'staff'
  displayName: string
  createdAt: string
}
type Invite = { code: string; role: 'manager' | 'staff'; expiresAt: string }

const oak = 'var(--theme-accent)'
const ROLE_LABEL: Record<'manager' | 'staff', string> = { manager: '完整管理', staff: '協助接單' }

export default function MembersView({ providerId }: { providerId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [newRole, setNewRole] = useState<'manager' | 'staff'>('staff')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/members?providerId=${providerId}`, { headers: authHeader() })
      if (!res.ok) { setMsg('載入失敗，請稍後再試'); return }
      const data = await res.json()
      setMembers(data.members ?? [])
      setInvites(data.invites ?? [])
      setMsg('')
    } catch {
      setMsg('連線異常，請稍後再試')
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => { load() }, [load])

  async function createInvite() {
    setCreating(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, role: newRole }),
      })
      if (!res.ok) { setMsg('產生邀請失敗，請稍後再試'); return }
      await load()
    } catch {
      setMsg('連線異常，請稍後再試')
    } finally {
      setCreating(false)
    }
  }

  async function remove(target: { lineUserId?: string; code?: string }, confirmText: string) {
    if (!window.confirm(confirmText)) return
    try {
      const res = await fetch('/api/admin/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, ...target }),
      })
      // ⚠️ 一定要檢查 res.ok —— 靜默失敗會讓店主以為權限已移除，實際上對方還進得來
      if (!res.ok) { setMsg('移除失敗，請重新整理後再試'); return }
      await load()
    } catch {
      setMsg('連線異常，請稍後再試')
    }
  }

  const box = {
    background: 'var(--theme-panel)', border: '1px solid var(--theme-border)',
    boxShadow: 'var(--theme-card-shadow)', borderRadius: '14px', padding: '14px', marginBottom: '10px',
  } as const

  return (
    <div style={{ padding: '18px 16px 40px' }}>
      <p style={{ fontSize: 'calc(12.5px * var(--fs, 1))', color: 'var(--theme-muted)', lineHeight: 1.8, marginBottom: '16px' }}>
        邀請客服或助理協助你管理預約。<br />
        <strong style={{ color: 'var(--theme-ink)' }}>預約通知仍然只會發到你的 LINE</strong>，協作夥伴不會收到推播。
      </p>

      {msg && (
        <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#a2543f', marginBottom: '12px' }}>{msg}</p>
      )}

      {/* ── 產生邀請 ── */}
      <div style={{ ...box, background: 'rgba(var(--theme-accent-rgb-legacy),0.06)' }}>
        <p style={{ fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 600, color: 'var(--theme-ink)', marginBottom: '10px' }}>邀請新夥伴</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {(['staff', 'manager'] as const).map(r => (
            <button key={r} onClick={() => setNewRole(r)} style={{
              flex: 1, minHeight: '44px', borderRadius: '10px', cursor: 'pointer',
              border: newRole === r ? `1.5px solid ${oak}` : '1px solid var(--theme-border)',
              background: newRole === r ? 'rgba(var(--theme-accent-rgb-legacy),0.14)' : 'transparent',
              color: 'var(--theme-ink)', fontSize: 'calc(12.5px * var(--fs, 1))',
              fontWeight: newRole === r ? 700 : 400,
            }}>{ROLE_LABEL[r]}</button>
          ))}
        </div>
        <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: 'var(--theme-muted)', lineHeight: 1.7, marginBottom: '12px' }}>
          {newRole === 'staff'
            ? '可以處理預約、手動建單、寫客戶備註。不能改服務價格與排班。'
            : '除了處理預約，也可以調整服務項目、價格與排班。'}
        </p>
        <button onClick={createInvite} disabled={creating} style={{
          width: '100%', minHeight: '44px', borderRadius: '10px', border: 'none',
          background: oak, color: 'var(--theme-on-accent)', fontWeight: 700,
          fontSize: 'calc(13px * var(--fs, 1))', cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.6 : 1,
        }}>{creating ? '產生中…' : '＋ 產生邀請連結'}</button>
      </div>

      {/* ── 未使用的邀請 ── */}
      {invites.length > 0 && (
        <>
          <p style={{ fontSize: 'calc(11px * var(--fs, 1))', letterSpacing: '0.1em', color: 'var(--theme-muted)', margin: '18px 0 8px' }}>尚未使用的邀請</p>
          {invites.map(inv => {
            const url = liffOpenUrl(`/join-team/${inv.code}`)
            return (
              <div key={inv.code} style={box}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                  <span style={{ fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 600, color: 'var(--theme-ink)' }}>{ROLE_LABEL[inv.role]}</span>
                  <span style={{ fontSize: 'calc(10.5px * var(--fs, 1))', color: 'var(--theme-muted)' }}>
                    {new Date(inv.expiresAt).toLocaleDateString('zh-TW')} 前有效
                  </span>
                </div>
                {/* 顯示可選取的完整網址：LINE webview 常常沒有剪貼簿 API（Day 8/08 教訓） */}
                <CopyableUrl url={url} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={async () => setMsg(await copyText(url) ? '已複製，貼給對方即可' : '複製失敗，請長按上方網址手動複製')}
                    style={{ flex: 1, minHeight: '44px', borderRadius: '10px', border: `1.5px solid ${oak}`, background: 'transparent', color: 'var(--theme-accent-strong)', fontSize: 'calc(12.5px * var(--fs, 1))', fontWeight: 600, cursor: 'pointer' }}>
                    複製連結
                  </button>
                  <button onClick={() => remove({ code: inv.code }, '確定作廢這條邀請連結？')}
                    style={{ minHeight: '44px', padding: '0 16px', borderRadius: '10px', border: '1px solid var(--theme-border)', background: 'transparent', color: 'var(--theme-muted)', fontSize: 'calc(12.5px * var(--fs, 1))', cursor: 'pointer' }}>
                    作廢
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ── 成員名單 ── */}
      <p style={{ fontSize: 'calc(11px * var(--fs, 1))', letterSpacing: '0.1em', color: 'var(--theme-muted)', margin: '18px 0 8px' }}>
        目前的協作夥伴{members.length > 0 ? `（${members.length}）` : ''}
      </p>
      {loading && <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'var(--theme-muted)' }}>載入中…</p>}
      {!loading && members.length === 0 && (
        <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'var(--theme-muted)', lineHeight: 1.8 }}>
          還沒有協作夥伴。產生邀請連結傳給對方，他在 LINE 裡點開就能加入。
        </p>
      )}
      {members.map(m => (
        <div key={m.lineUserId} style={{ ...box, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 'calc(13px * var(--fs, 1))', fontWeight: 600, color: 'var(--theme-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.displayName || '（未填稱呼）'}
            </p>
            <p style={{ fontSize: 'calc(10.5px * var(--fs, 1))', color: 'var(--theme-muted)', marginTop: '2px' }}>
              {ROLE_LABEL[m.role]} · LINE {m.masked}
            </p>
          </div>
          <button onClick={() => remove({ lineUserId: m.lineUserId }, `移除「${m.displayName || '這位夥伴'}」的後台權限？他會立刻無法進入。`)}
            style={{ flexShrink: 0, minHeight: '44px', padding: '0 14px', borderRadius: '10px', border: '1px solid var(--theme-border)', background: 'transparent', color: '#a2543f', fontSize: 'calc(12.5px * var(--fs, 1))', cursor: 'pointer' }}>
            移除
          </button>
        </div>
      ))}
    </div>
  )
}
