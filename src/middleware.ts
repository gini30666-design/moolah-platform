import { NextRequest, NextResponse } from 'next/server'

// ============================================================
//  網域搬家 301 轉址：舊 moolah-platform.vercel.app → moolah.studio
//  目的：SEO 收斂（舊網址從搜尋消失、權重轉新網域），完成單一 moolah.studio 系統。
//
//  ⚠️ 安全鐵律：matcher 已排除 /api/* →
//     LINE webhook（moolah-platform.vercel.app/api/line/webhook, active）與 7 支 cron
//     打在 vercel.app 的 /api，**絕不能被 301**（LINE/Vercel cron 不跟隨轉址會斷）。
//     故 /api 永遠不進這支 middleware，webhook/cron 在 vercel.app 照常運作。
//  ⚠️ 只精確比對 production 網址 moolah-platform.vercel.app；
//     部署預覽網址（moolah-platform-xxxx.vercel.app）與 moolah.studio 本身不受影響。
// ============================================================
const OLD_HOST = 'moolah-platform.vercel.app'
const NEW_ORIGIN = 'https://moolah.studio'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  if (host === OLD_HOST) {
    const { pathname, search } = request.nextUrl
    // GSC 擁有權驗證檔不轉址（vercel.app 資源驗證用 → Removals 從搜尋移除舊網址）
    if (/^\/google[0-9a-f]+\.html$/.test(pathname)) return NextResponse.next()
    return NextResponse.redirect(`${NEW_ORIGIN}${pathname}${search}`, 301)
  }
  return NextResponse.next()
}

export const config = {
  // 排除 /api（webhook/cron 保命）與 /_next（靜態資源效能）；其餘頁面才轉址
  matcher: ['/((?!api/|_next/).*)'],
}
