'use client'
import Script from 'next/script'
import { META_EVENT, type FunnelStage } from '@/lib/funnel'

// Meta Pixel ID：Events Manager → 資料來源 → 你的 Pixel
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''

export default function MetaPixel() {
  if (!PIXEL_ID) return null
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img height="1" width="1" style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

type Fbq = (
  cmd: 'track' | 'trackCustom',
  event: string,
  data?: Record<string, unknown>,
  opts?: { eventID?: string },
) => void

function fbq(): Fbq | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as Window & { fbq?: Fbq }).fbq
}

/** Meta 標準事件清單 —— 不在裡面的要用 trackCustom 送，否則 Meta 會忽略 */
const STANDARD = new Set([
  'PageView', 'ViewContent', 'Search', 'AddToCart', 'AddToWishlist',
  'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'Lead', 'CompleteRegistration',
  'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'Schedule',
  'StartTrial', 'SubmitApplication', 'Subscribe',
])

/**
 * 送一個漏斗事件到瀏覽器 Pixel。
 *
 * ⚠️ eventId 很重要：伺服器端 CAPI 會用同一個 id 再送一次，Meta 靠它去重。
 *    不給 id 的話同一個動作會被算成兩次。
 */
export function trackPixel(
  stage: FunnelStage,
  eventId?: string,
  customData?: Record<string, unknown>,
) {
  const f = fbq()
  if (!f) return
  try {
    const name = META_EVENT[stage]
    const cmd = STANDARD.has(name) ? 'track' : 'trackCustom'
    f(cmd, name, customData ?? {}, eventId ? { eventID: eventId } : undefined)
  } catch { /* 追蹤失敗絕不能擋住主流程 */ }
}

/** 招商表單送出（保留舊名，既有呼叫點不用改） */
export function trackLead(eventId?: string) {
  trackPixel('lead', eventId)
}

/** 點了「加 LINE」按鈕（招商動線專用，消費者動線不可呼叫） */
export function trackContact(eventId?: string) {
  trackPixel('contact', eventId)
}
