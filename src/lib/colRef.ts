/**
 * 試算表欄位字母 → 0-based 索引（pure，無 I/O，可獨立測試）。
 * 'A'→0、'Z'→25、'AA'→26、'AB'→27（bijective base-26）。
 *
 * 🔴 2026-08-12 修：舊版是 `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(letters)`，
 *    單字母正確，但雙字母會**靜默給出錯的答案**：
 *      'AA' → -1（找不到）
 *      'AB' → 0 ← 因為 'AB' 是 'ABCD…' 的子字串！讀 A2:AB 只會回傳第一欄
 *    providers 表當時已用到第 26 欄（Z），下一個新欄位就會踩到，
 *    而且不噴錯、只是拿到錯的資料 —— 與 Day 64「加欄位沒改範圍」同一類 bug。
 *
 * ⚠️ 獨立成檔是為了測試：sheets.ts 一 import 就會初始化 Supabase client（需要 env），
 *    測試環境沒有那些變數。同 slots.ts / aiBundle.ts 的做法。
 */
export function colToIndex(letters: string): number {
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64) // 'A'.charCodeAt(0)===65 → 1
  return n - 1
}
