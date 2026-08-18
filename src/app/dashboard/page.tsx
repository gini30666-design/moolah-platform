'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'
import MoolahLoader from '@/components/MoolahLoader'
import OpenInLine from '@/components/OpenInLine'

type State = 'loading' | 'need_line' | 'not_found' | 'pick' | 'error'

type Membership = {
  providerId: string
  name: string
  category: string
  role: 'owner' | 'manager' | 'staff'
}

const ROLE_LABEL: Record<Membership['role'], string> = {
  owner: '店主',
  manager: '管理',
  staff: '協助接單',
}

// 多個後台時記住上次選的，常駐客服不用每次挑
const LAST_KEY = 'moolah_last_provider'

export default function DashboardPage() {
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [name, setName] = useState('')
  const [needLinePath, setNeedLinePath] = useState('/dashboard')
  const [memberships, setMemberships] = useState<Membership[]>([])

  useEffect(() => {
    // Read destination from two sources:
    // 1. liff.state (first visit via LIFF URL: liff.line.me/ID?to=designer-002)
    // 2. direct ?to= param (after liff.login redirectUri brings user back)
    const params = new URLSearchParams(window.location.search)
    const liffState = params.get('liff.state') ?? ''
    const destination =
      new URLSearchParams(liffState).get('to') ||
      params.get('to') ||
      ''

    liff
      .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(async () => {
        if (!liff.isLoggedIn()) {
          // 🔴 外部瀏覽器不能直接 liff.login()，會無限跳轉（見 OpenInLine 註解）。
          // dashboard 是 LIFF endpoint，正常只會在 LINE 內被開啟；
          // 但只要有人在瀏覽器貼網址或點到舊連結就會卡死，所以一律防呆。
          if (!liff.isInClient()) {
            setNeedLinePath(destination || '/dashboard')
            setState('need_line')
            return
          }
          // Preserve destination in redirectUri — liff.init() strips liff.state from URL
          const base = `${window.location.origin}/dashboard`
          const redirectUri = destination
            ? `${base}?to=${encodeURIComponent(destination)}`
            : base
          liff.login({ redirectUri })
          return
        }

        const profile = await liff.getProfile()
        setName(profile.displayName)

        const res = await fetch(`/api/dashboard/me?userId=${profile.userId}`)
        const data = await res.json()
        const list: Membership[] = Array.isArray(data.memberships) ? data.memberships : []
        setMemberships(list)

        const dest = destination
          ? (destination.startsWith('/') ? destination : `/${destination}`)
          : ''
        // 目的地的第一段路徑：'/liberty-island/book' → 'liberty-island'、'/claim/xxx' → 'claim'
        const destOwner = dest.split('/').filter(Boolean)[0] ?? ''

        // 🔴 明確帶了 ?to= 就以它為準 —— 但「指向自己」除外。
        //
        //    舊版是 `if (data.found) → 自己後台`，設計師身分無條件蓋過 destination。
        //    後果不只是測試不便：**任何設計師想去別的職人那裡預約都會被綁架回自己後台**
        //    （zuzu 想約自由島、甜姐兒想約別家全中招）。
        //
        //    保留 Day 32 的隱藏功能「設計師掃立牌＝實體快速登入」：
        //    掃自己的立牌（to 指向自己）仍然進後台，那才是這功能的真實情境；
        //    掃別人的立牌則照常進對方頁面，不再莫名其妙彈到自己後台。
        //    ⬆️ 多帳號後這條規則不變，只是「自己」＝ 我有權限的任何一家。
        const goingToOwnPage = list.some(m => m.providerId === destOwner)

        if (dest && !goingToOwnPage) {
          router.replace(dest)
          return
        }
        if (list.length === 0) {
          setState('not_found')
          return
        }
        // 指定了自己的某一家（掃自己的立牌）→ 直接進那一家
        if (goingToOwnPage) {
          router.replace(`/${destOwner}/admin`)
          return
        }
        if (list.length === 1) {
          router.replace(`/${list[0].providerId}/admin`)
          return
        }
        // 多家：優先回上次選的，沒有才顯示選擇畫面。
        // `?pick=1` 強制顯示 —— 後台的「切換後台」就是導回這裡，
        // 沒有這個逃生口的話，記住上次選擇會讓人永遠切不回另一家。
        const forcePick = params.get('pick') === '1'
        const last = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_KEY) : null
        if (!forcePick && last && list.some(m => m.providerId === last)) {
          router.replace(`/${last}/admin`)
          return
        }
        setState('pick')
      })
      .catch(() => setState('error'))
  }, [router])

  if (state === 'loading') {
    return <MoolahLoader label="識別身份中…" />
  }

  if (state === 'need_line') {
    return <OpenInLine path={needLinePath} />
  }

  if (state === 'error') {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3 px-6 text-center">
        <p className="text-sm text-gray-500">連線異常，請重新整理頁面</p>
      </div>
    )
  }

  // pick：這個 LINE 帳號能進多個後台（店主自己有多家，或協作客服服務多家）
  if (state === 'pick') {
    return (
      <div className="min-h-screen bg-[#1a1714] text-[#fbf9f4] px-6 py-14 flex flex-col justify-center">
        <p className="text-[10px] tracking-[0.24em] uppercase text-[#a68966] text-center mb-3">Select Account</p>
        <p className="text-center mb-1" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.55rem', fontWeight: 300 }}>
          要進哪一個後台？
        </p>
        <p className="text-center text-[12px] text-[#fbf9f4]/40 mb-7 leading-relaxed">
          {name ? `嗨，${name}　` : ''}你目前可以管理 {memberships.length} 個帳號
        </p>

        <div className="flex flex-col gap-2.5">
          {memberships.map(m => (
            <button
              key={m.providerId}
              onClick={() => {
                try { window.localStorage.setItem(LAST_KEY, m.providerId) } catch { /* 私密瀏覽模式會擋，忽略 */ }
                router.replace(`/${m.providerId}/admin`)
              }}
              className="w-full text-left rounded-2xl px-5 py-4 flex items-center justify-between gap-3"
              style={{ minHeight: '64px', background: 'rgba(251,249,244,0.04)', border: '1px solid rgba(166,137,102,0.22)' }}
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold truncate">{m.name}</span>
                <span className="block text-[11.5px] text-[#fbf9f4]/40 mt-0.5 truncate">{m.category}</span>
              </span>
              <span className="shrink-0 text-[10.5px] rounded-full px-2.5 py-1"
                style={{ background: 'rgba(166,137,102,0.14)', border: '1px solid rgba(166,137,102,0.3)', color: '#c9ab84' }}>
                {ROLE_LABEL[m.role] ?? '協助接單'}
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] text-[#fbf9f4]/25 mt-6 leading-relaxed">
          之後會直接進上次選的那一個<br />要換的話在後台選單按「切換後台」
        </p>
      </div>
    )
  }

  // not_found：此 LINE 帳號尚未綁定任何服務商
  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4 px-8 text-center">
      <div className="w-14 h-14 bg-[#f5efe6] rounded-full flex items-center justify-center mb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="#A68966" strokeWidth={1.5} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          {name ? `嗨，${name}` : '您好'}
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          目前此 LINE 帳號尚未與任何<br />MooLah 合作夥伴帳號綁定。
        </p>
      </div>
      <a
        href="mailto:service@moolah.studio?subject=申請加入 MooLah 合作夥伴"
        className="mt-2 px-6 py-3 bg-[#2C2825] text-[#fbf9f4] text-sm rounded-full"
      >
        聯絡 MooLah 申請加入
      </a>
      <a href="/" className="text-xs text-gray-300 underline underline-offset-2">
        回到官網
      </a>
    </div>
  )
}
