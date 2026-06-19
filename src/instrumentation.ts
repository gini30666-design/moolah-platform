// ============================================================
//  全域錯誤監控（Next.js onRequestError 內建鉤子）
//  任何伺服器端 / API 路由未捕捉的錯誤 → ① 寫進 Vercel logs ② LINE 即時通知 Gini
//  零外部服務、零註冊。之後若要更完整（stack 分組/前端錯誤/source map）可再接 Sentry。
// ============================================================

// 同一錯誤訊息的節流（避免單一事故狂洗版）：每則 key 最多每 10 分鐘推一次
const lastAlertAt = new Map<string, number>()
const THROTTLE_MS = 10 * 60 * 1000

type ReqInfo = { path?: string; method?: string }
type CtxInfo = { routePath?: string; routeType?: string }

export async function onRequestError(
  err: unknown,
  request: ReqInfo,
  context: CtxInfo,
) {
  const message = err instanceof Error ? err.message : String(err)
  const where = context?.routePath || request?.path || 'unknown'

  // ① 一律進 Vercel logs（含 stack）
  console.error('[onRequestError]', request?.method, where, '\n', err)

  // 只在正式環境發 LINE 警報（本機/預覽不吵）
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return
  const ops = process.env.OPS_LINE_USER_ID
  if (!ops) return

  // 節流
  const key = `${where}|${message}`.slice(0, 200)
  const now = Date.now()
  if (now - (lastAlertAt.get(key) ?? 0) < THROTTLE_MS) return
  lastAlertAt.set(key, now)

  try {
    const { pushMessage } = await import('@/lib/line')
    const t = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })
    await pushMessage(
      ops,
      `⚠️ MooLah 線上錯誤\n` +
      `路由：${where}\n` +
      `方法：${request?.method ?? '-'} ${request?.path ?? ''}\n` +
      `訊息：${message}\n` +
      `時間：${t}\n` +
      `（詳細 stack 見 Vercel logs）`,
    )
  } catch (e) {
    console.error('[onRequestError] 發 LINE 警報失敗:', e)
  }
}
