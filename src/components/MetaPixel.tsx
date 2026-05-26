'use client'
import Script from 'next/script'

// Replace PIXEL_ID with your Meta Pixel ID after creating Meta Business account
// Meta Business Suite → Events Manager → Connect Data Sources → Web → Get Pixel ID
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

// Call this when a lead form is submitted
export function trackLead() {
  if (typeof window !== 'undefined' && (window as Window & { fbq?: Function }).fbq) {
    ;(window as Window & { fbq?: Function }).fbq!('track', 'Lead')
  }
}
