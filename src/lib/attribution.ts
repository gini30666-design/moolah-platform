'use client'

// 來源歸因 —— 把「這個人是從哪支廣告來的」一路帶到表單送出為止。
//
// 為什麼要做（2026-08-13）：
//   在這之前只有 7/29 建的三支廣告有 utm_content，之後新建的都沒加，
//   所以 `leads` 表裡只知道「有人填了表」，不知道是哪支廣告帶來的。
//   兩個真實客戶的歸因只能靠「進線時間 × 當天投遞資料」交叉推論。
//
// 🔑 first-touch 與 last-touch 都要存：
//   有人可能先看到 Meta Reels（認識我們）→ 幾天後 Google 搜品牌字進來 → 才填表。
//   只存 last-touch 會判成「Google 帶來的客戶」，但真正讓他認識我們的是 Meta。
//   兩個都存，才分得出「誰開啟需求」和「誰收成」。

const KEY = 'moolah_attr_v1'

export type Attribution = {
  // last-touch（最後一次帶來源的造訪）
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  // first-touch（第一次認識我們）
  firstUtmSource?: string
  firstUtmMedium?: string
  firstUtmCampaign?: string
  firstUtmContent?: string
  firstSeenAt?: string
  // 平台點擊 ID —— 比 UTM 精確，而且名稱改了也不會失效
  fbclid?: string
  gclid?: string
  referrer?: string
  landingPath?: string
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : undefined
}

/**
 * Meta 的 _fbp / _fbc cookie —— CAPI 靠這兩個把伺服器事件對回廣告點擊。
 *
 * ⚠️ 這裡有個容易漏掉的坑（2026-08-13 顧問點出）：
 *    `_fbc` 是「Pixel 看到網址上的 fbclid 之後才會寫入」的。
 *    如果 Pixel 被廣告封鎖器擋掉、或使用者在 Pixel 載入完成前就送出表單，
 *    cookie 就是空的 —— 而 fbclid 明明就在網址上。
 *    → 所以 cookie 沒有時，我們自己照 Meta 的格式組一個：fb.{subdomainIndex}.{ms}.{fbclid}
 *    moolah.studio 是 eTLD+1（沒有 www 子網域）→ subdomainIndex = 1
 */
export function getFbCookies(): { fbp?: string; fbc?: string } {
  const fbp = readCookie('_fbp')
  let fbc = readCookie('_fbc')
  if (!fbc) {
    let stored: Attribution = {}
    try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') } catch { /* ignore */ }
    const id = new URLSearchParams(window.location.search).get('fbclid') || stored.fbclid
    if (id) fbc = `fb.1.${Date.now()}.${id}`
  }
  return { fbp, fbc }
}

/** 落地時呼叫一次：把網址上的來源資訊收下來存好 */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  let stored: Attribution = {}
  try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') } catch { /* 壞掉就當空的 */ }

  const q = new URLSearchParams(window.location.search)
  const g = (k: string) => q.get(k) ?? undefined

  const src = g('utm_source'), med = g('utm_medium')
  const camp = g('utm_campaign'), cont = g('utm_content')
  const fbclid = g('fbclid'), gclid = g('gclid')

  // 有 UTM 或有平台點擊 ID，都算「這次造訪是廣告帶來的」
  const hasNew = Boolean(src || camp || cont || fbclid || gclid)

  const next: Attribution = { ...stored }

  if (hasNew) {
    // last-touch 整組覆蓋（沿用舊值會讓歸因指向錯的廣告）
    next.utmSource = src; next.utmMedium = med
    next.utmCampaign = camp; next.utmContent = cont
    next.referrer = document.referrer || undefined
    next.landingPath = window.location.pathname
    // 平台點擊 ID 只在有新值時更新，沒帶就保留舊的
    if (fbclid) next.fbclid = fbclid
    if (gclid) next.gclid = gclid

    // first-touch 只寫一次，之後永不覆蓋
    if (!next.firstSeenAt) {
      next.firstUtmSource = src; next.firstUtmMedium = med
      next.firstUtmCampaign = camp; next.firstUtmContent = cont
    }
  }

  // 不管有沒有來源，第一次來訪的時間與落地頁一定要記
  next.referrer ??= document.referrer || undefined
  next.landingPath ??= window.location.pathname
  next.firstSeenAt ??= new Date().toISOString()

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
