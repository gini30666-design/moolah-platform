// ============================================================
//  輕量限流（in-memory / 零外部服務）
//  用於公開 POST 端點（booking/leads/feedback/review/waitlist）擋腳本洪水。
//  ⚠️ best-effort：Serverless 多實例下非全域精確，但足以擋單一來源的暴力洗版；
//     要跨實例精確再升級 Upstash / Vercel KV（需帳號，屆時無痛替換此檔）。
// ============================================================
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

// 取用戶端 IP（Vercel 會帶 x-forwarded-for）。接受 Request / NextRequest。
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? ''
  return xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

// 固定視窗限流。回 true=放行、false=超限。
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()

  // 記憶體保護：bucket 過多時清掉已過期的
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k)
  }

  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count++
  return true
}
