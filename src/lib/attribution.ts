'use client'

// 來源歸因 —— 把「這個人是從哪支廣告來的」一路帶到表單送出為止。
//
// 為什麼要做（2026-08-13）：
//   在這之前只有 7/29 建的三支廣告有 utm_content，之後新建的都沒加，
//   所以 `leads` 表裡只知道「有人填了表」，不知道是哪支廣告帶來的。
//   兩個真實客戶的歸因只能靠「進線時間 × 當天投遞資料」交叉推論。
//
// 做法：落地時把 UTM 存進 localStorage，表單送出時一起帶給後端寫進 DB。
// 採 **last-touch**：網址帶了新的 utm_source 就覆蓋（最後點的那支廣告才是促成轉換的）。

const KEY = 'moolah_attr_v1'

export type Attribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  referrer?: string
  landingPath?: string
  firstSeenAt?: string
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : undefined
}

/** Meta 的 _fbp / _fbc cookie —— CAPI 靠這兩個把伺服器事件對回廣告點擊 */
export function getFbCookies(): { fbp?: string; fbc?: string } {
  return { fbp: readCookie('_fbp'), fbc: readCookie('_fbc') }
}

/** 落地時呼叫一次：把網址上的 UTM 收下來存好 */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  let stored: Attribution = {}
  try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') } catch { /* 壞掉就當空的 */ }

  const q = new URLSearchParams(window.location.search)
  const fromUrl: Attribution = {
    utmSource:   q.get('utm_source')   ?? undefined,
    utmMedium:   q.get('utm_medium')   ?? undefined,
    utmCampaign: q.get('utm_campaign') ?? undefined,
    utmContent:  q.get('utm_content')  ?? undefined,
  }

  // 網址有帶新的來源 → 整組覆蓋（last-touch）；沿用舊的會讓歸因指向錯的廣告
  const hasNew = Boolean(fromUrl.utmSource || fromUrl.utmCampaign || fromUrl.utmContent)
  const next: Attribution = hasNew
    ? {
        ...fromUrl,
        referrer: document.referrer || undefined,
        landingPath: window.location.pathname,
        firstSeenAt: stored.firstSeenAt ?? new Date().toISOString(),
      }
    : {
        ...stored,
        referrer: stored.referrer ?? (document.referrer || undefined),
        landingPath: stored.landingPath ?? window.location.pathname,
        firstSeenAt: stored.firstSeenAt ?? new Date().toISOString(),
      }

  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* 無痕模式會擋，忽略 */ }
  return next
}

/** 表單送出時呼叫：拿回存好的來源 + Meta cookie */
export function getAttribution(): Attribution & { fbp?: string; fbc?: string } {
  if (typeof window === 'undefined') return {}
  let stored: Attribution = {}
  try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') } catch { /* ignore */ }
  return { ...stored, ...getFbCookies() }
}
