// Lead 分數 —— 用來回答「哪支廣告帶來的是**好客戶**」，而不只是「哪支帶來最多人」。
//
// 顧問 2026-08-13 指出的最大遺漏：
//   Lead 不等於好客戶。有人只是填了姓名電話，不代表他是美業工作室主。
//   如果只看 Lead 數，會把「很會帶填表的人」的廣告當成贏家。
//
// ⚠️ 誠實界線：這裡算的是**進線當下能從表單推得的分數（0-3）**，是個先驗值，
//    不是真正的資格判定。真正的 4-5 分要 Gini 談過才知道
//    （是不是本人開的、有沒有固定客源、每月預約量）。
//    → 談完用 `scripts/lead.mjs qualify <id> --score N` 更新，那時才送 QualifiedLead 事件。

export type LeadFormSignals = {
  category?: string        // 服務類別（選填）
  district?: string        // 地區（選填）
  currentMethod?: string   // 目前怎麼接預約（選填）
  plan?: string            // trial | direct
}

/** 顧問給的分級定義，寫下來避免之後各自解讀 */
export const SCORE_MEANING: Record<number, string> = {
  0: '不相關／看不出身分',
  1: '美業從業者',
  2: '有自己的工作室',
  3: '正在找預約系統',
  4: '願意試用',
  5: '已開始使用',
}

/**
 * 從表單欄位算初始分數（0-3）。
 *
 * 只有兩個必填（姓名＋聯絡方式），所以多數人會落在 0-1 —— 這是預期的，
 * 不要為了讓分數好看去把欄位改回必填，那會讓表單轉換率掉（Day 53 才降的門檻）。
 */
export function scoreLeadForm(s: LeadFormSignals): number {
  let n = 0
  // 選了服務類別 ＝ 自己對號入座說「我是這一行的」
  if (s.category?.trim()) n += 1
  // 願意回答「目前怎麼接預約」＝ 已經意識到這是個問題，不是純好奇
  if (s.currentMethod?.trim()) n += 1
  // 直接要正式加入（跳過試用）＝ 意圖最強
  if (s.plan === 'direct') n += 1
  return Math.min(n, 3)
}

/** 目前門檻：談過並確認身分才算 qualified。程式不自動判定。 */
export const QUALIFIED_MIN_SCORE = 4
