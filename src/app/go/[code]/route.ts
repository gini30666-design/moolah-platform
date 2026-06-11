import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 立牌 QR 入口：查 shortCode → 導進 LINE 內的 LIFF 預約頁（拿 LINE 身分 + 可推播）。
// 非 LINE 環境（桌機/未裝 LINE）自動 fallback 到網頁預約頁。
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const rows = await getSheetData('providers!A2:M')

  // 第 13 欄（index 12）是 shortCode
  const match = rows.find(r => r[12]?.toLowerCase() === code.toLowerCase())
  if (!match) {
    return NextResponse.redirect(new URL('/', req.url), { status: 302 })
  }

  const providerId = match[0]
  const path = `/${providerId}/book`
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  const webUrl = new URL(path, req.url).toString()
  const liffUrl = liffId ? `https://liff.line.me/${liffId}${path}` : webUrl

  const html = `<!doctype html><html lang="zh-Hant"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MooLah 預約</title>
<script>setTimeout(function(){location.replace(${JSON.stringify(liffUrl)})},900)</script>
<style>
:root{--charcoal:#1a1714;--oak:#A68966;--cream:#fbf9f4}
*{margin:0;box-sizing:border-box}
body{background:var(--charcoal);color:var(--cream);font-family:-apple-system,"PingFang TC",sans-serif;
min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:32px;text-align:center}
.brand{color:var(--oak);letter-spacing:.18em;font-size:20px}
.t{font-size:15px;opacity:.85;line-height:1.7}
.btn{display:inline-block;background:var(--oak);color:var(--charcoal);font-weight:600;
padding:15px 34px;border-radius:99px;text-decoration:none;font-size:16px}
.sub{color:var(--oak);opacity:.7;font-size:13px;text-decoration:none;border-bottom:1px solid rgba(166,137,102,.4);padding-bottom:2px}
.dot{width:6px;height:6px;background:var(--oak);transform:rotate(45deg);display:inline-block;margin:0 6px}
</style></head><body>
<div class="brand">MooLah</div>
<div class="t">正在用 LINE 開啟預約…<br>於 LINE 中開啟可一鍵預約並收到提醒 <span class="dot"></span></div>
<a class="btn" href="${liffUrl}">用 LINE 開啟預約</a>
<a class="sub" href="${webUrl}">改用瀏覽器繼續</a>
</body></html>`

  return new NextResponse(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })
}
