import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
// Google Ads 轉換代碼（同一個 gtag.js，額外 config 一個 AW 帳戶即可回報轉換）
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18344665774'

export default function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
          gtag('config', '${ADS_ID}');
        `}
      </Script>
    </>
  )
}
