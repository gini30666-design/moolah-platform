import { describe, expect, it } from 'vitest'
import { isMobileDevice, isInLineApp } from './device'

// 2026-08-21 桌機 Chrome 實測到的無限迴圈：
//   liff.line.me 在桌機喚不起 LINE App → 被送回 /dashboard → 又叫他「在 LINE 裡開啟」→ ♾️
// 所以「這台裝置是不是手機」直接決定我們給按鈕還是給 QR，判斷錯就把客人丟進迴圈。
const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  lineIOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/14.10.1',
  igIOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 330.0',
  macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  winChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
}

describe('isMobileDevice — 決定給「開啟 LINE」按鈕還是給 QR', () => {
  it('手機一律 true（liff.line.me 喚得起 App）', () => {
    expect(isMobileDevice(UA.iphone)).toBe(true)
    expect(isMobileDevice(UA.android)).toBe(true)
    expect(isMobileDevice(UA.lineIOS)).toBe(true)
    expect(isMobileDevice(UA.igIOS)).toBe(true)   // IG 內建瀏覽器也是手機
  })

  it('🔴 桌機一律 false —— 給了按鈕就是無限迴圈', () => {
    expect(isMobileDevice(UA.macChrome)).toBe(false)
    expect(isMobileDevice(UA.winChrome)).toBe(false)
  })

  it('🔴 取不到 UA 時當桌機（fail-safe：寧可給 QR，也不要把人丟進迴圈）', () => {
    expect(isMobileDevice('')).toBe(false)
  })
})

describe('isInLineApp', () => {
  it('LINE 內建瀏覽器 true，其他 false', () => {
    expect(isInLineApp(UA.lineIOS)).toBe(true)
    expect(isInLineApp(UA.iphone)).toBe(false)
    expect(isInLineApp(UA.igIOS)).toBe(false)
    expect(isInLineApp(UA.macChrome)).toBe(false)
  })
})
