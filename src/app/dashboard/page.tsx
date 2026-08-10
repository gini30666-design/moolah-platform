'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'
import MoolahLoader from '@/components/MoolahLoader'
import OpenInLine from '@/components/OpenInLine'

type State = 'loading' | 'need_line' | 'not_found' | 'error'

export default function DashboardPage() {
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [name, setName] = useState('')
  const [needLinePath, setNeedLinePath] = useState('/dashboard')

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

        if (data.found) {
          // 設計師 → 跳轉自己的後台
          router.replace(`/${data.providerId}/admin`)
        } else if (destination) {
          // 消費者帶有 to 目標 → 跳轉指定設計師頁
          router.replace(destination.startsWith('/') ? destination : `/${destination}`)
        } else {
          setState('not_found')
        }
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
