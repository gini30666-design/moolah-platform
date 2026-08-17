# MooLah 八主題切換系統設計規格

**日期：** 2026-08-17  
**狀態：** 已由 Gini 核准開始執行  
**回滾點：** `book-visual-safe-v2`  
**既有守門：** `scripts/verify_book_visual.sh`（不可修改邏輯指紋或放寬判定）

## 1. 目標

在不複製頁面、不改變預約／LIFF／後台業務邏輯的前提下，讓每位職人從後台選擇一個品牌主題，並同步套用到：

- 專屬首頁 `/${providerId}`
- 預約頁 `/${providerId}/book`
- 後台 `/${providerId}/admin`

系統需提供八個可實際展示與保存的主題：

| key | 中文名稱 |
|---|---|
| `bali-stone` | 峇里石境 |
| `ubud-slow` | 烏布慢居 |
| `quiet-luxury` | 靜奢度假 |
| `moolah-gold` | MooLah 原生金（預設） |
| `rainforest-jade` | 雨林青玉 |
| `terracotta-sunset` | 赤陶夕照 |
| `indigo-tides` | 海鹽靛藍 |
| `orchid-dusk` | 蘭霧夜宴 |

## 2. 不可破壞的界線

以下既有行為不得修改：

- 所有 `fetch(...)` 的網址、method、headers、body 與錯誤分支。
- `authHeader()`、LIFF 初始化／登入／profile／openWindow 流程。
- `handleSubmit`、409 衝突處理、`res.ok` 檢查。
- `LineRequiredScreen`、`DemoCompletionScreen` 的觸發條件。
- 稱呼與電話 required、隱私權政策連結。
- 預約步驟、欄位、日期與時段邏輯、候補流程。
- 後台預約、服務、排班、作品集、候補的功能與導覽架構。
- LINE 綠 `#06C755`、危險紅 `#b04040` 與共用深炭骨架的語意。
- `scripts/verify_book_visual.sh` 的邏輯指紋、測試門檻及判定方式。
- tag `book-visual-safe-v2`。

主題只能控制呈現層：顏色 token、表面、邊框、陰影、封面遮罩、材質強度與品牌裝飾。不得從資料庫讀取任意 CSS；資料庫只保存白名單 key。

## 3. 架構

### 3.1 一份頁面、八份 recipe

建立 `src/lib/providerTheme.ts`，集中定義：

- `PROVIDER_THEME_KEYS`
- `ProviderThemeKey`
- `DEFAULT_PROVIDER_THEME = 'moolah-gold'`
- `normalizeProviderTheme(value)`
- UI 所需中文名稱與色票摘要

三頁最外層使用 `data-theme="<key>"`。CSS 在 `globals.css` 以 `[data-theme="..."]` 覆蓋語意變數，不建立八份 React 頁面。

### 3.2 相容 token 層

先加入新的語意 token，再把舊 token 指向它們：

```css
--theme-accent: #A68966;
--theme-accent-rgb: 166 137 102;
--theme-accent-rgb-legacy: 166,137,102;
--theme-accent-strong: #8a6f4f;
--theme-accent-light: #c4a882;
--theme-accent-pale: #ede3d8;
--theme-accent-dim: #D9C5B2;
--theme-background: #fbf9f4;
--theme-surface: #f5efe6;
--theme-surface-deep: #ede8dc;
--theme-border: #e8e0d8;
--theme-selected: #c4845a;
--theme-selected-rgb: 196 132 90;
--theme-selected-rgb-legacy: 196,132,90;
--theme-shadow-rgb: 44 40 37;
--theme-hero-overlay: rgba(26, 23, 20, 0.52);
--theme-texture-opacity: 0.025;

--oak: var(--theme-accent);
--oak-light: var(--theme-accent-light);
--oak-pale: var(--theme-accent-pale);
--oak-dim: var(--theme-accent-dim);
--oak-40: rgba(var(--theme-accent-rgb-legacy),0.4);
--cream: var(--theme-background);
--sand: var(--theme-surface);
--sand-deep: var(--theme-surface-deep);
--border: var(--theme-border);
```

透明品牌色使用 `rgba(var(--theme-accent-rgb-legacy),<alpha>)`。此寫法仍由主題 token 控制，並保留原本 legacy `rgba(...)` 的像素合成結果；實測改成現代空白分隔 `rgb(... / alpha)` 會在漸層產生 ±1 色階的捨入差。不得殘留 `rgba(166,137,102,...)` 硬編金色。

### 3.3 Phase 0：零視覺變化

Phase 0 僅把三個目標頁面與共用樣式中的品牌色硬編值收斂到變數。不得加入主題差異。

驗證流程：

1. 改動前啟動同一份本地服務，固定資料與動畫狀態。
2. 截取專屬首頁、預約頁、後台，viewport 390 與 1440，共六張 PNG。
3. Phase 0 後以同樣指令重截六張。
4. 逐像素 RGBA 比較；六張 diff pixel count 都必須等於 0。
5. 任一張不為 0：立即停止、保留證據並回報，不進 Phase 1。

截圖基準及 diff 報告放在 `.visual-baseline/theme-phase0/`，該目錄加入 `.gitignore`，不污染產品資產。

### 3.4 套用時機與避免閃色

- 專屬首頁：Server Component 已取得 provider；把 `theme` 傳給 Client Component，初始 HTML 即帶 `data-theme`。
- 預約頁／後台：provider API 回傳 theme；現有 loader 期間先正規化 theme，再渲染實際頁面。
- 預覽：允許白名單 `previewTheme` query 覆蓋顯示，但不寫 DB。
- 禁止用 localStorage 保存職人主題；localStorage 只可維持既有後台字級設定。

### 3.5 資料持久化（AA 欄不可漏）

`providers.theme` 是第 27 欄（AA），nullable text，null／空值／未知值一律顯示 `moolah-gold`。

同一任務必須一起完成：

1. Supabase schema／migration 新增 `providers.theme`。
2. `src/lib/sheets.ts` 的 `TABLE_COLS.providers` 尾端加 `'theme'`。
3. `src/app/api/booking/route.ts` 的 `providers!A2:Z` 改成 `providers!A2:AA`。
4. `src/app/api/provider/[id]/route.ts` 的 `providers!A2:Z` 改成 `providers!A2:AA`，並回傳正規化後 theme。
5. `src/lib/providerData.ts` 的 Supabase select/type 加入 theme，供 SSR 首頁使用。

新增受保護的 `/api/admin/theme`：

- 使用既有 LIFF bearer token 取得 user id。
- 驗證該 user id 是 provider owner。
- 僅接受八個白名單 key。
- PATCH 成功只更新 `providers.theme`。
- 未授權 401／403、provider 不存在 404、非法 key 400。

不得直接套用 Supabase migration。程式碼、migration／DDL 草稿與預設值可先完成；任何資料庫改動（包含 `ALTER TABLE`、新增 `theme` 欄位或資料寫入）都必須在執行前再次取得 Gini 明確核准。

## 4. 後台主題展示與選擇

在後台排班設定區加入「品牌主題」面板：

- 八張主題卡，顯示中文名、三個色點與選中勾。
- 點選只更新本地 preview state，立即改變整個後台的 `data-theme`。
- 提供「預覽專屬首頁」「預覽預約頁」連結，帶 `previewTheme=<key>`。
- 「儲存主題」才呼叫受保護 API。
- 儲存失敗保留未保存狀態並顯示內嵌錯誤，不假成功。
- 所有可點元素最小 40px，主要儲存按鈕 44px。

## 5. 專屬首頁調整

保留現有內容順序與資料來源，調整第一屏：

- 真正使用 `coverUrl` 作為 image-led hero；沒有 cover 時回退現有淡色 header。
- 顯示店名、地點、評分、tagline。
- 加入快速預約 dock：最近可約、起始價格、開始預約。
- 保留職人介紹、專長、作品／環境 masonry、內容流 CTA 與 fixed CTA。
- hero 可使用主題遮罩；作品與服務照片不得套 filter，維持作品真實顏色。
- 不新增假評價、假年資、假統計或假作品。

## 6. 測試與守門

### 自動測試

- `normalizeProviderTheme`：八個合法值保留；null、空字串、未知值回退預設。
- theme route：合法 owner 可保存；非法 theme、缺 token、非 owner、provider 不存在都拒絕。
- provider range／AA mapping：theme 位於 index 26，舊 0–25 欄不位移。
- 預覽 query：只接受白名單，不可形成任意 class／CSS 注入。
- Phase 0 硬編品牌色掃描：三目標頁不得殘留受管控的金／選中色碼或對應 RGB literal。

### 既有守門

每個階段執行原封不動的：

```bash
bash scripts/verify_book_visual.sh
```

並另外執行：

```bash
npm test
npx tsc --noEmit
npm run build
```

### 視覺與互動矩陣

- Phase 0：6 張 before/after PNG，diff 必須 0。
- 主題完成：8 主題 × 3 頁面 × 2 viewport，48 張檢查；其中 24 組頁面狀態必須人工逐項確認可讀性。
- 手機真機：demo 完整預約、LINE 加好友、隱私連結、非 LINE gate、Lia 長服務清單。
- 對比度：主要文字與控制 ≥ 4.5:1；大字 ≥ 3:1。

## 7. Git、部署與回滾

- 只在 `codex/theme-system-v1` worktree 開發，不改主工作目錄 `main`。
- 每個 Phase 獨立提交；不得改寫或刪除 `book-visual-safe-v2`。
- 不自動 merge、push、正式部署或執行正式 DB migration。
- 任一守門失敗，停在當前 Phase，不進下一階段。
- 回滾以當前 Phase 前一提交為主；總保險絲維持 `book-visual-safe-v2`。

## 8. 非目標

- 不允許職人輸入自訂 hex／CSS。
- 不製作八份頁面副本。
- 不重構預約業務邏輯或後台資料流。
- 不修改 LINE、預約 API、時段計算或資料驗證。
- 不把概念圖中的假文字、假數字或虛構空間帶入正式資料。
