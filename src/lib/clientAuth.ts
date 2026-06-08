import liff from '@line/liff'

// 取得後台 API 呼叫所需的 Authorization header（帶 LIFF access token）
export function authHeader(): Record<string, string> {
  try {
    const token = liff.getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}
