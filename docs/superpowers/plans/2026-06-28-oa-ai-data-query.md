# OA 自然語言資料查詢 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓綁定的設計師在 LINE OA 用自然語言查 MooLah 系統內資料（預約/行程/客人/服務/營收），現有關鍵字系統 0 改動，AI 只當對不到關鍵字時的兜底。

**Architecture:** 新模組 `src/lib/aiAssistant.ts`：撈該設計師唯讀資料包 → 壓成精簡文字 → 丟 Claude Haiku 4.5 單次呼叫（無工具）→ 回純文字答案。`webhook/route.ts` 的最終預設兜底改為「設計師→AI、消費者→現有預設卡」。失敗自動退回預設卡。

**Tech Stack:** Next.js API route、`@anthropic-ai/sdk`（已安裝）、Claude Haiku 4.5（`claude-haiku-4-5-20251001`）、Supabase-backed `getSheetData`、Vitest。

**欄位參考**：`bookings!A2:M` = [0]id [1]providerId [2]serviceId [3]customerName [4]lineUserId [5]date [6]time [7]note [8]createdAt [9]gender [10]hairLength [11]phone [12]status。`services!A2:F` = [0]providerId [1]serviceId [2]name [3]price [4]duration [5]desc。

---

### Task 1: aiAssistant 純格式化函式 + 型別（TDD）

**Files:**
- Create: `src/lib/aiAssistant.ts`
- Test: `src/lib/aiAssistant.test.ts`

- [ ] **Step 1: 寫 failing test**

```ts
// src/lib/aiAssistant.test.ts
import { describe, it, expect } from 'vitest'
import { buildDataBundleText, type ProviderData } from './aiAssistant'

const sample: ProviderData = {
  today: '2026-06-29',
  upcoming: [
    { date: '2026-06-29', time: '10:00', customerName: '小明', customerPhone: '0968081521', serviceName: '剪髮' },
    { date: '2026-06-30', time: '14:00', customerName: '小華', customerPhone: '', serviceName: '染髮' },
  ],
  weekStats: { range: '06-22 – 06-28', confirmed: 1, completed: 2, cancelled: 1, noShow: 0, revenue: 2400 },
  monthStats: { ym: '2026-06', confirmed: 3, completed: 5, cancelled: 2, noShow: 1, revenue: 8800 },
  services: [
    { name: '剪髮', price: 800, duration: 60 },
    { name: '染髮', price: 1600, duration: 120 },
  ],
  recentCustomers: [{ name: '小明', visits: 3 }, { name: '小華', visits: 1 }],
}

describe('buildDataBundleText', () => {
  it('包含未來預約、本週/本月統計、服務價格、客人', () => {
    const text = buildDataBundleText(sample)
    expect(text).toContain('2026-06-29 10:00')
    expect(text).toContain('小明')
    expect(text).toContain('0968081521')
    expect(text).toContain('剪髮')
    expect(text).toContain('800')
    expect(text).toContain('06-22 – 06-28')
    expect(text).toContain('2026-06')
    expect(text).toContain('2,400')   // 本週營收千分位
    expect(text).toContain('今天：2026-06-29')
  })

  it('未來預約為空時顯示「無」', () => {
    const text = buildDataBundleText({ ...sample, upcoming: [] })
    expect(text).toContain('未來預約：無')
  })
})
```

- [ ] **Step 2: 跑測試確認 FAIL**

Run: `env -u NODE_OPTIONS npx vitest run src/lib/aiAssistant.test.ts`
Expected: FAIL（`buildDataBundleText` 未定義 / 模組不存在）

- [ ] **Step 3: 寫最小實作**

```ts
// src/lib/aiAssistant.ts
export type ProviderData = {
  today: string
  upcoming: Array<{ date: string; time: string; customerName: string; customerPhone: string; serviceName: string }>
  weekStats: { range: string; confirmed: number; completed: number; cancelled: number; noShow: number; revenue: number }
  monthStats: { ym: string; confirmed: number; completed: number; cancelled: number; noShow: number; revenue: number }
  services: Array<{ name: string; price: number; duration: number }>
  recentCustomers: Array<{ name: string; visits: number }>
}

export function buildDataBundleText(d: ProviderData): string {
  const upcoming = d.upcoming.length
    ? d.upcoming.map(b => `  ${b.date} ${b.time}｜${b.customerName}｜${b.serviceName}${b.customerPhone ? `｜${b.customerPhone}` : ''}`).join('\n')
    : '無'
  const services = d.services.length
    ? d.services.map(s => `  ${s.name}：NT$${s.price.toLocaleString()}／${s.duration}分`).join('\n')
    : '無'
  const customers = d.recentCustomers.length
    ? d.recentCustomers.map(c => `  ${c.name}（累計 ${c.visits} 次）`).join('\n')
    : '無'
  const wk = d.weekStats
  const mo = d.monthStats
  return [
    `今天：${d.today}`,
    '',
    `未來預約：${d.upcoming.length ? '' : '無'}`,
    ...(d.upcoming.length ? [upcoming] : []),
    '',
    `本週（${wk.range}）：成交 ${wk.completed + wk.confirmed} 筆（完成 ${wk.completed}／待服務 ${wk.confirmed}／取消 ${wk.cancelled}／no-show ${wk.noShow}）；營收 NT$${wk.revenue.toLocaleString()}`,
    `本月（${mo.ym}）：成交 ${mo.completed + mo.confirmed} 筆（完成 ${mo.completed}／待服務 ${mo.confirmed}／取消 ${mo.cancelled}／no-show ${mo.noShow}）；營收 NT$${mo.revenue.toLocaleString()}`,
    '',
    `服務項目：`,
    services,
    '',
    `近期客人：`,
    customers,
  ].join('\n')
}
```

- [ ] **Step 4: 跑測試確認 PASS**

Run: `env -u NODE_OPTIONS npx vitest run src/lib/aiAssistant.test.ts`
Expected: PASS（2 個 test 綠）

- [ ] **Step 5: Commit**

```bash
git add src/lib/aiAssistant.ts src/lib/aiAssistant.test.ts
git commit -m "feat(ai): aiAssistant 資料包格式化函式 + 測試"
```

---

### Task 2: 撈資料 + Haiku 呼叫（gatherProviderData / answerProviderQuery）

**Files:**
- Modify: `src/lib/aiAssistant.ts`

- [ ] **Step 1: 加入日期 helper + gatherProviderData + answerProviderQuery**

在 `src/lib/aiAssistant.ts` 頂部加 import 與 helpers，檔尾加兩個函式：

```ts
// 檔案最上方（型別之上）
import Anthropic from '@anthropic-ai/sdk'
import { getSheetData } from './sheets'

const client = new Anthropic() // 讀 ANTHROPIC_API_KEY

function todayTW(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00+08:00')
  d.setDate(d.getDate() + n)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
```

```ts
// 檔尾
export async function gatherProviderData(providerId: string): Promise<ProviderData> {
  const [bookingRows, serviceRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
  ])
  const mine = bookingRows.filter(r => r[1] === providerId)
  const services = serviceRows
    .filter(r => r[0] === providerId)
    .map(r => ({ name: (r[2] as string) ?? '', price: Number(r[3]) || 0, duration: Number(r[4]) || 0 }))
  const svcName = (sid: string) => services.length && serviceRows.find(s => s[0] === providerId && s[1] === sid)?.[2] as string || '服務'
  const svcPrice = (sid: string) => Number(serviceRows.find(s => s[0] === providerId && s[1] === sid)?.[3]) || 0

  const today = todayTW()
  const weekStart = addDays(today, -6)
  const monthYm = today.slice(0, 7)

  const upcoming = mine
    .filter(r => (r[5] as string) >= today && (r[12] ?? '') !== 'cancelled')
    .sort((a, b) => (a[5] + a[6]).localeCompare(b[5] + b[6]))
    .slice(0, 10)
    .map(r => ({ date: r[5] as string, time: r[6] as string, customerName: (r[3] as string) ?? '', customerPhone: (r[11] as string) ?? '', serviceName: svcName(r[2] as string) }))

  const statOf = (rows: typeof mine) => {
    const cnt = (st: string) => rows.filter(r => (r[12] ?? '') === st).length
    const revenue = rows.filter(r => (r[12] ?? '') !== 'cancelled' && (r[12] ?? '') !== 'no_show')
      .reduce((s, r) => s + svcPrice(r[2] as string), 0)
    return { confirmed: cnt('confirmed'), completed: cnt('completed'), cancelled: cnt('cancelled'), noShow: cnt('no_show'), revenue }
  }
  const weekRows = mine.filter(r => (r[5] as string) >= weekStart && (r[5] as string) <= today)
  const monthRows = mine.filter(r => (r[5] as string).slice(0, 7) === monthYm)

  const seen = new Map<string, number>()
  for (const r of mine) {
    if ((r[12] ?? '') === 'cancelled') continue
    const n = (r[3] as string) ?? ''
    if (n) seen.set(n, (seen.get(n) ?? 0) + 1)
  }
  const recentCustomers = [...seen.entries()].slice(0, 10).map(([name, visits]) => ({ name, visits }))

  return {
    today,
    upcoming,
    weekStats: { range: `${weekStart.slice(5)} – ${today.slice(5)}`, ...statOf(weekRows) },
    monthStats: { ym: monthYm, ...statOf(monthRows) },
    services,
    recentCustomers,
  }
}

const SYSTEM_PROMPT =
  `你是 MooLah 給設計師的「資料查詢助手」。只根據下方提供的資料，回答關於預約、行程、客人、服務、營收數字的事實問題。` +
  `不要提供經營建議、行銷點子、或與這些資料無關的內容——遇到這類問題，禮貌說明「這不在 MooLah 的服務範圍，我可以幫你查預約／行程／客人／服務／營收」。` +
  `找不到資料就直接說找不到。一律繁體中文、簡短、直接給答案，不要輸出推理過程。`

export async function answerProviderQuery(providerId: string, providerName: string, question: string): Promise<string> {
  const data = await gatherProviderData(providerId)
  const bundle = buildDataBundleText(data)
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `【設計師：${providerName}】\n以下是你的 MooLah 資料：\n\n${bundle}\n\n———\n問題：${question}` }],
  })
  const text = res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('\n').trim()
  return text || '抱歉，我沒能整理出答案，請換個方式問，或用關鍵字（今日／本週／我的預約）查詢。'
}
```

- [ ] **Step 2: tsc 驗證**

Run: `env -u NODE_OPTIONS npx tsc --noEmit`
Expected: 0 error

- [ ] **Step 3: 既有測試回歸**

Run: `env -u NODE_OPTIONS npx vitest run`
Expected: PASS（Task 1 的 2 個 + slots 17 個 = 19 綠）

- [ ] **Step 4: Commit**

```bash
git add src/lib/aiAssistant.ts
git commit -m "feat(ai): gatherProviderData + answerProviderQuery（Haiku 唯讀單次呼叫）"
```

---

### Task 3: webhook 最終兜底接上 AI

**Files:**
- Modify: `src/app/api/line/webhook/route.ts`（import 區 + 最終預設段 762-765）

- [ ] **Step 1: 加 import**

在 webhook 既有 `@/lib/line` import 之後加：

```ts
import { answerProviderQuery } from '@/lib/aiAssistant'
```

- [ ] **Step 2: 改最終預設兜底**

把檔尾這段：

```ts
      // 預設
      await replyMessage(replyToken, [
        { type: 'flex', altText: '有什麼可以幫您？', contents: buildDefaultFlex() },
      ])
```

改成：

```ts
      // 預設兜底：設計師 → AI 自然語言資料查詢；消費者 → 預設卡
      if (provider) {
        try {
          const answer = await answerProviderQuery(provider.providerId, provider.name, userText)
          await pushMessage(userId, answer)
        } catch (err) {
          console.error('[webhook AI fallback error]', err)
          await replyMessage(replyToken, [
            { type: 'flex', altText: '有什麼可以幫您？', contents: buildDefaultFlex() },
          ])
        }
        continue
      }
      await replyMessage(replyToken, [
        { type: 'flex', altText: '有什麼可以幫您？', contents: buildDefaultFlex() },
      ])
```

- [ ] **Step 3: tsc 驗證**

Run: `env -u NODE_OPTIONS npx tsc --noEmit`
Expected: 0 error

- [ ] **Step 4: Commit**

```bash
git add src/app/api/line/webhook/route.ts
git commit -m "feat(ai): webhook 兜底接 AI 資料查詢（設計師端、失敗退回預設卡）"
```

---

### Task 4: 設定 ANTHROPIC_API_KEY + 部署 + 實機驗證

**Files:** 無（環境變數 + 部署 + 手機驗證）

- [ ] **Step 1: 確認 Gini 已建立 ANTHROPIC_API_KEY**

前提：Gini 在 console.anthropic.com 建好 API key 並提供。Claude 用 Vercel CLI 寫入 Production：
```bash
# 在 moolah-platform/，依互動提示貼上 key 值
vercel env add ANTHROPIC_API_KEY production
```
Expected: 顯示 Added Environment Variable

- [ ] **Step 2: 部署**

```bash
git push origin main
```
Expected: Vercel 自動部署成功（或 `vercel --prod`）

- [ ] **Step 3: 實機驗證（Gini 手機，綁定 designer-003 的 LINE）**

逐一打字到 OA，確認：
- 「這週有幾個客人」→ 回本週筆數
- 「接下來行程」→ 列未來預約
- 「下一位客人是誰」→ 回最近一筆未來預約客人姓名/時段/服務
- 「剪髮多少錢」→ 回價格
- 「幫我想母親節活動」→ 禮貌拒絕「不在服務範圍」
- 既有關鍵字（今日／本週／我的預約／客服）→ 行為**完全不變**
- 用**未綁定**的 LINE 打同樣問句 → 維持現有預設卡（不進 AI）

- [ ] **Step 4: 失敗兜底驗證（選用）**

暫時把 Vercel 的 `ANTHROPIC_API_KEY` 改錯 → 重打問句 → 應收到「預設卡」而非錯誤；驗畢改回正確 key。

---

## Self-Review

- **Spec 覆蓋**：觸發兜底（Task 3）✓、資料包（Task 1+2）✓、Haiku 唯讀單次（Task 2）✓、只設計師觸發（Task 3 `if (provider)`）✓、失敗退回預設卡（Task 3 try/catch）✓、繁中拒絕非範圍（Task 2 SYSTEM_PROMPT）✓、ANTHROPIC_API_KEY 前提（Task 4）✓、回歸測試（Task 4 Step 3）✓。
- **Placeholder**：無 TBD/TODO；每步含完整 code 或確切指令。
- **型別一致**：`ProviderData`（Task 1）↔ `gatherProviderData` 回傳（Task 2）↔ `buildDataBundleText` 參數（Task 1）一致；`answerProviderQuery(providerId, name, question)`（Task 2）↔ webhook 呼叫（Task 3）簽名一致。
- 註：`buildDataBundleText` 的 `weekStats.confirmed/completed` 在 text 內以 `completed+confirmed` 當「成交」，測試斷言用 `revenue` 千分位與欄位字串，已對齊。
