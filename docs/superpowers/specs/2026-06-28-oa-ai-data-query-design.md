# Spec：OA 自然語言資料查詢（設計師端・唯讀・兜底）

**日期**：2026-06-28
**狀態**：設計核准，待寫實作計畫

## Context（為什麼）
MooLah 的 LINE OA 目前用「關鍵字 → Flex 卡片」回應（今日/明日/本週/休假/@客名…），設計師要記指令。Gini 想**額外**加一層：設計師用自然語言（講人話）問**系統內已有的資料**，AI 聽懂後照實回答。現有關鍵字系統**完全不動**，AI 只當「聽不懂關鍵字時的兜底」。

明確定位：**AI 只是「系統資料的自然語言查詢介面」**，不是經營顧問。只回答關於預約/行程/客人/服務/營收數字的事實問題。經營建議、行銷、與系統資料無關的問題 → 禮貌說明不在服務範圍。

## Goals
- 設計師可用自然語言查 MooLah 內的資料，例：
  - 「這週有幾個客人」→ 本週預約筆數（含狀態）
  - 「接下來行程」→ 未來預約清單
  - 「下一位客人是誰」→ 最近一筆未來預約的客人姓名/電話/服務/時段
  - 「剪髮多少錢」→ 服務價格
- 現有關鍵字/卡片行為 0 改動。
- 唯讀、低成本、失敗有兜底。

## Non-goals（Phase 1 不做）
- 動作型（改排班/設休假/推播/改約）— 維持用既有關鍵字。
- 經營/行銷建議、寫文案 —「不在 MooLah 服務範圍」。
- 消費者端 AI（非綁定設計師的訊息不進 AI，維持現有預設卡）。
- 工具呼叫 / 多輪 agent（先做單次 context 塞入；不夠再升級）。

## 架構

### 觸發點（唯一掛勾）
`src/app/api/line/webhook/route.ts` 的**最終預設兜底**（目前 `buildDefaultFlex` 那段）。走到這裡代表：訊息**沒對到任何關鍵字**（設計師或消費者關鍵字皆未命中）。改為：
```
若 provider（已綁定設計師）→ 交給 AI 助手（push 回覆）
否則（消費者）→ 維持現有 buildDefaultFlex 卡片
```
- `provider` 變數早在函式上方已用 `findProviderByLineUserId(userId)` 取得，作用域可用。
- 設計師命中既有關鍵字（今日/明日/本週/休假/@客名/noshow/黑名單）時，**早就 `continue` 了**，不會到這個兜底 → AI 只接「真的對不到」的自然語言問句。

### AI 助手模組（新檔 `src/lib/aiAssistant.ts`）
匯出 `answerProviderQuery(providerId, providerName, question): Promise<string>`：
1. **撈資料包**（唯讀，用既有 `getSheetData`）：
   - 未來預約（今天起，依時間排序，取前 ~10 筆）：日期/時段/客人姓名/電話/服務名。
   - 本週 & 本月：預約筆數（confirmed/completed/cancelled/no_show 分類）+ 營收（valid × service price）。
   - 服務清單：名稱/價格/時長。
   - 近期客人摘要（去重，最近 ~10 位姓名 + 累計次數）。
   - 全部壓成精簡文字塊（控 token）。
2. **呼叫 Anthropic**（沿用 `opsAgent.ts` 的 `new Anthropic()` 讀 `ANTHROPIC_API_KEY`）：
   - Model：**Claude Haiku 4.5**（`claude-haiku-4-5-20251001`），單次 `messages.create`，無工具。
   - System prompt（重點）：
     > 你是 MooLah 給設計師的「資料查詢助手」。只根據下方提供的資料，回答關於預約、行程、客人、服務、營收數字的事實問題。**不要**提供經營建議、行銷點子、或與這些資料無關的內容——遇到這類問題，禮貌說明「這不在 MooLah 的服務範圍，我可以幫你查預約/行程/客人/服務/營收」。找不到資料就說找不到。一律繁體中文、簡短、直接給答案。
   - User content：資料包 + 設計師問句。
3. 回傳純文字答案。

### 回覆方式
- 用 `pushMessage(userId, answer)`（**非 replyToken**：AI 呼叫需數秒，replyToken 可能逾時；webhook 既有資料型回覆都用 push）。
- 可附 `PROVIDER_QUICK_REPLY`（沿用既有）方便接續操作。
- 觸發前可先 push 一則「查詢中…」否則使用者等待無回饋（選用，實作時定）。

## 安全 / 成本 / 失敗
- **唯讀**：aiAssistant 不呼叫任何寫入。
- **只設計師**：消費者非關鍵字訊息不進 AI（省成本、聚焦）。
- **成本**：1 問 = 1 次 Haiku 呼叫（context 塞入、無工具迴圈），每次幾毫分。
- **失敗兜底**：`answerProviderQuery` 若拋錯（沒設 key／API 失敗）→ webhook catch 後退回現有 `buildDefaultFlex` 預設卡，系統不壞。
- **隱私**：回客人姓名/電話僅限「該設計師自己的預約」資料（本就是他的客；與既有 @客名 同等級）。

## 前提
- Vercel 設環境變數 `ANTHROPIC_API_KEY`（Gini 建立 → Claude 寫入 + redeploy）。Anthropic API 與 $20 訂閱分開計費。

## 改動檔案
- 新增：`src/lib/aiAssistant.ts`（資料包 + Haiku 呼叫）。
- 修改：`src/app/api/line/webhook/route.ts`（最終兜底：provider → AI；其餘不動）。
- 依賴：`@anthropic-ai/sdk` 已安裝，免裝。

## 驗證（端到端）
1. 本地 `npx tsc --noEmit` 0 error。
2. 設好 `ANTHROPIC_API_KEY` 部署後，用綁定的 LINE（designer-003）打非關鍵字問句：
   - 「這週有幾個客人」「接下來行程」「下一位客人是誰」「剪髮多少錢」→ 應得正確資料答案。
   - 「幫我想母親節活動」→ 應禮貌拒絕（不在服務範圍）。
   - 既有關鍵字（今日/本週/我的預約/客服…）→ 行為完全不變（回歸測試）。
3. 未綁定 LINE 打同樣問句 → 維持現有預設卡（不進 AI）。
4. 暫時移除/錯誤 key → 退回預設卡，不報錯給使用者。

## 之後可擴充（非本次）
- Phase 2：工具型（任意深度問題）、動作型（改排班/休假）、消費者端 AI。
