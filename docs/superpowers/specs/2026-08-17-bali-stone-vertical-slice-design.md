# MooLah Bali Stone Vertical Slice 設計規格

日期：2026-08-17  
狀態：Gini 已核准先完成 Bali Stone，再看實際系統截圖  
基準：`codex/theme-system-v1` @ `8eec670`

## 一、目標

把 `bali-stone` 從「整頁煤黑配色」重做成最初參考圖的完整藝術指導，覆蓋職人首頁、預約流程與職人後台。功能資料、文字來源、連結與事件仍共用原架構；本輪不處理其餘七個主題。

參考圖以以下檔案為視覺基準：

- `/Users/gini/Documents/Codex/2026-08-15/new-chat/outputs/moolah-variant-bali-stone.png`
- `/var/folders/8w/frftdd5j6pq3d3fv1yr93x_h0000gn/T/codex-clipboard-8091e023-963a-4475-97d7-f1cc12398d81.png`
- `/Users/gini/Documents/Codex/2026-08-15/new-chat/outputs/moolah-eight-themes-home.png`

## 二、問題根因

目前 `bali-stone` 的 canvas、surface、panel、field 與 header 都沿用同一條暗色階，三個頁面的整體 silhouette 也與其他主題相同。`ProviderThemeShell` 又把 legacy aliases 一次綁到整頁 recipe，因此主題只能改變色相、圓角、陰影與圖片 filter，無法表達石材、黑木與象牙工作面的明暗交替。

同時，theme hardcode scanner 的 managed literal 清單不完整。後台仍有 `#7d736b`、`#574e48`、`#8a7e76`、`#c8c0b8`、`#4e453f`、`#d0c8c0` 等固定棕灰文字；在 dark panel 或小字情境存在不可讀風險。

## 三、選定方案

### 3.1 一套功能邏輯，三頁區域化視覺契約

不建立 Bali 專用頁面、不複製 handler、不讓 theme key 進入 booking/admin API 邏輯。保留現有 DOM 的功能節點，在既有 `data-layout` 下增加視覺 region 標記，並新增區域語意 token：

```text
home:
  --theme-home-canvas
  --theme-home-ink
  --theme-home-profile
  --theme-home-profile-ink
  --theme-home-gallery
  --theme-home-dock

booking:
  --theme-book-canvas
  --theme-book-ink
  --theme-book-workbench
  --theme-book-panel
  --theme-book-slot-stage
  --theme-book-slot-ink
  --theme-book-header

admin:
  --theme-admin-canvas
  --theme-admin-ink
  --theme-admin-header
  --theme-admin-workbench
  --theme-admin-panel
  --theme-admin-field
```

其餘七個主題先 alias 到現有 semantic roles，因此這批新 region token 對它們不造成視覺變化。只有 `[data-theme="bali-stone"]` 定義新的石材／黑木區域配方。

### 3.2 Bali Stone 的物理場景

使用者像走進午後自然光下的峇里 SPA：石灰牆、象牙礦物工作面、深色燒杉木、少量舊金屬與葉影。深色只負責品牌 framing、時段舞台與關鍵 CTA；閱讀、日期與資料操作使用明亮石材面。

材質不新增遠端圖片依賴，以低對比 CSS noise、礦物漸層與葉影 radial gradients 表達。裝飾層必須在內容之下、`pointer-events:none`，不得使用 `z-index:9999`。

## 四、三頁構圖

### 4.1 職人首頁

- 保留 cover、職人資料、作品順序與所有連結。
- Cover 維持 full-bleed，使用暖石色 image filter 與可讀 overlay。
- 最近可約 dock 使用象牙石材面，跨在照片與內容之間。
- 職人介紹使用炭黑木質 stage，象牙文字與細金屬邊線；不是把整個頁面都塗黑。
- 專長 pills 改為低對比金屬細線，不使用同一種圓角卡堆疊。
- 作品／空間區回到明亮石灰面，照片成為主角。
- Sticky CTA 使用深木底＋舊金邊，文字對比 ≥4.5:1。

### 4.2 預約流程

- Header 為炭黑木質 framing，步驟與 active state 使用象牙／舊金。
- LINE 與已選服務維持明亮工作面。
- 已選服務在有選擇時壓縮為單一摘要與「更換服務」入口；完整服務選項改為可展開的呈現，日期進入第一個任務 viewport。所有服務選擇 handler 與資料來源不變。
- 日期／月曆使用象牙石材面；selected day 為深木＋金框。
- 時段區是獨立炭黑舞台，分上午／下午／晚上；slot 文字一律亮色，selected 使用舊金框與明確填色。
- 顧客資料回到明亮工作面；placeholder 與 label 對實際 field ≥4.5:1。
- Sticky CTA 維持既有步驟與 submit 行為，只改視覺。

### 4.3 職人後台

- 後台是高頻工具，不做全黑。
- Header 使用炭黑木質與細金線，provider name 與 menu 保持清楚。
- KPI、資料對帳、tabs、timeline 與 forms 使用象牙／石灰工作面。
- 主題色只出現在 header、active tabs、主要 CTA、時間軸重點與少量數字，不搶占 status 綠／黃／紅的語意。
- 移除 CreditsPanel 的 3px 單側 accent border，改成完整邊框／面層差異。
- 水平主 tabs 保留既有功能，但手機必須顯示可滑動提示或完整邊界，不留下半個字。
- 所有 40px 功能按鈕提升至至少 44×44px。

## 五、字體與形狀

- 不新增字型依賴。
- 品牌顯示文字使用既有 Noto Serif TC／Cormorant；操作 labels、buttons、fields 使用既有 sans。
- 後台資料 labels 不使用 display serif。
- Bali Stone 圓角克制：workbench 10–14px、關鍵浮層 16–18px，不再所有卡片同一大圓角。
- 陰影只用於浮動 dock／sticky CTA；石材工作面主要靠完整細邊框與明暗分層。

## 六、可讀性契約

- 一般文字與實際背景 ≥4.5:1。
- 大字 ≥3:1。
- placeholder、inactive tab、disabled text 仍 ≥4.5:1；disabled 以邊線、填色與 icon 補充，不只靠低 opacity。
- 深木／slot stage 上不得出現固定深色文字。
- 清理 theme-owned 固定棕灰 literals；LINE 綠、error red、status colors、image overlay 可保留為明確例外。
- hardcode scanner 必須涵蓋上述 legacy neutral families，且 fixture test 證明會報錯。

## 七、功能與安全邊界

不得改動：

- booking submit、availability、409、required、privacy 與 customerPhone
- LINE required、LIFF identity、demo no-write 與完成頁邏輯
- owner authorization、admin fetch／mutation endpoints 與 handler
- provider theme whitelist、AA column/index 26 與 fallback
- cover 管理權限
- `scripts/verify_book_visual.sh`
- Supabase schema 與任何 DDL／UPDATE／INSERT／DELETE

不得 merge、push 或 deploy。

## 八、驗證與交付

自動驗證：

- Bali region token contract 與 contrast tests
- hardcode scanner executable fixtures
- full Vitest
- TypeScript
- production build
- `scripts/verify_book_visual.sh`
- protected script diff 0

瀏覽器驗證：

- Bali Stone × home/book/admin × 390×844 與 1440×1000，共 6 張
- document horizontal overflow = 0
- visible text contrast audit：normal、muted、placeholder、inactive、disabled、status
- 日期／slot／tabs／CTA 位置與參考圖比對
- 後台若用臨時本機 QA bypass，必須同回合還原，auth/proxy 殘留 0

交付：

- 3 張手機實際系統截圖與 1 張三頁 contact sheet
- 與參考圖的差異說明
- 給阿東的 commit range、測試證據與明確未執行項目

## 九、完成標準

- 第一眼能辨認出石材、黑木、象牙與舊金的 Bali Stone 世界，而不是黑色 App skin。
- 首頁沉浸、預約任務清楚、後台耐看可操作；三頁同一口音但不強制同一明暗比例。
- 深色舞台上所有文字清楚；明亮工作面不被黑色 canvas 污染。
- 不看顏色時仍能從深淺節奏、材質、區域 framing 與形狀辨認 Bali Stone。
- 所有功能與安全守門通過後才允許交付截圖；本輪仍不允許部署或資料庫變更。
