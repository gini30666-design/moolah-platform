# MooLah 八主題深度系統設計規格

日期：2026-08-17  
狀態：待 Gini 視覺方向確認後實作  
基準：`codex/theme-system-v1` @ `6c09d71`  

## 一、已核准的方向

八種主題不再只是 accent 換色，而是完整 art direction。首頁、預約頁、後台三者都必須跟著主題改變；淡色只是主題選項，不是後台固定底板。

分布固定為：

- 2 款淺色：`moolah-gold`、`quiet-luxury`
- 3 款中色沉浸：`ubud-slow`、`terracotta-sunset`、`orchid-dusk`
- 3 款深色：`bali-stone`、`rainforest-jade`、`indigo-tides`

功能、文字、連結、handler、API、LINE 身分、預約邏輯、資料索引與資料庫結構全部保持原樣。

## 二、問題根因

### 2.1 大多數主題只有 accent 不同

目前八個 `--theme-background` 全部落在近白色，因此即使 `data-theme` 正確，頁面仍呈現同一套白底白卡。

### 2.2 非 LINE 預約入口被金色背景鎖死

`LineRequiredScreen` 與 `DemoCompletionScreen` 把 `cream` 寫成 `#FBF9F4` 並直接用作大面積背景。從後台預覽預約頁時，如果 LINE WebView 以外部頁開啟，會先看到這兩個 gate，所以視覺上像完全沒有切換。

### 2.3 有些 `#fbf9f4` 是正確的亮色前景，不可盲目替換

完成畫面的勾勾與標題、首頁 cover 上的文字、進場動畫姓名都位於深色或圖片遮罩上，這些應改名為語意 token（例如 `--theme-on-image`），不能直接換成 theme background。掃描器要檢查「未語意化的主題色」，不能把所有白色一律視為 bug。

### 2.4 預覽連結在 LIFF 內未沿用既有開窗策略

連結 query 組法正確，但 `target="_blank"` 在 LINE WebView 可能開到外部瀏覽器，造成 LIFF 身分與預覽感受不一致。應在 LIFF 內使用 `liff.openWindow`，一般瀏覽器保留標準 href fallback。

## 三、選定的技術方案

採用「一套功能 DOM＋一套 semantic surface system＋八套 theme recipes」。不複製頁面、不為主題建立八份元件，也不在功能 handler 中加入主題分支。

### 3.0 評估過的三種做法

1. **只放大 accent 色面積**：改動最小，但 canvas、panel、field 仍接近白色，無法形成 2 淺＋3 中＋3 深，也會繼續出現「一半新色、一半舊白」；不採用。
2. **語意 surface system（採用）**：保留同一套 DOM 與功能，只讓每個主題定義 canvas、surface、panel、field、ink、header、shadow、影像處理等視覺角色；風格差異最大，功能風險最低。
3. **八套獨立頁面／component variants**：視覺自由度最高，但會讓三頁功能、修 bug 與測試成本乘以八，最容易破壞原架構；不採用。

### 3.1 Semantic tokens

在現有 accent tokens 之外新增／明確化：

- `--theme-canvas`：整頁底色
- `--theme-surface`：主要內容區
- `--theme-surface-deep`：第二層區塊
- `--theme-panel`：卡片／資訊板
- `--theme-panel-elevated`：modal、浮動摘要與關鍵面板
- `--theme-field`：input、textarea、日期／時間未選狀態
- `--theme-ink`、`--theme-ink-rgb-legacy`：主要文字
- `--theme-muted`：次要文字
- `--theme-border`：一般邊界
- `--theme-on-image`：圖片遮罩與深色 hero 上的亮色文字
- `--theme-on-accent`：accent strong 按鈕上的文字
- `--theme-header`：後台頂部與 booking sticky header 的主題承載面
- `--theme-card-radius`、`--theme-card-shadow`：主題形狀與深度
- `--theme-image-filter`：cover／作品圖的色調校正
- `--theme-texture-opacity`、`--theme-atmosphere`：材質與環境光

舊 `--cream`、`--charcoal`、`--sand` 可暫時 alias 到新的語意 token，降低一次改動量；所有硬編 `rgba(44,40,37,...)` 與白色半透明 panel 逐步改成 ink/panel RGB token，確保深色主題可讀。

### 3.2 Theme recipe 不進功能資料流

`provider.theme` 仍只保存原本 8 個 whitelist key。視覺 recipe 完全在 CSS tokens 中解析。預覽 query 仍只接受 whitelist；DDL 與儲存 API 不因本次視覺升級改變。

## 四、八套第一版視覺配方

色值是第一輪視覺起點，最終可依 390 與 1440 實拍微調；明暗分類與風格角色不改。

### 4.1 淺色

#### MooLah Gold — 原生品牌

- 奶油白 canvas、暖砂 surface、金棕 accent
- 卡片仍偏亮，但減少層層白卡
- 角色：熟悉、乾淨、品牌預設

#### Quiet Luxury — 石灰與墨

- 冷灰白 canvas、霧灰 surface、深褐墨文字
- 細邊線、較小圓角、低陰影
- 角色：克制、精品旅宿、安靜高級

### 4.2 中色沉浸

#### Ubud Slow — 苔綠與藤編

- 大面積苔綠／灰橄欖 canvas
- 內容 panel 使用較淺的同色系，不回到純白
- 圓角較柔、陰影像自然遮蔭
- 角色：烏布植栽、慢活、手作

#### Terracotta Sunset — 赤陶夕照

- 赤陶 canvas、曬暖 clay surface、深咖 ink
- CTA 與選中狀態使用深陶／炭色，不用金色濾鏡
- 角色：夕陽、陶器、肌膚溫度

#### Orchid Dusk — 暮紫夜宴

- 灰紫／暗梅 canvas、柔霧紫 panel
- 高光用淡蘭色，陰影帶酒紅而不是純黑
- 角色：夜間、香氛、女性精品但不甜膩

### 4.3 深色

#### Bali Stone — 火山石與象牙

- 火山石黑灰 canvas、炭褐 surface、象牙 ink
- panel 用石材層次，不使用白卡
- 角落更克制、邊線像細金屬框
- 角色：峇里石雕、夜間 SPA、沉靜

#### Rainforest Jade — 深玉雨林

- 深玉綠 canvas、濕潤墨綠 surface、霧白 ink
- panel 有青玉層次，accent 是苔光而非亮綠
- 角色：雨後森林、療癒、包覆感

#### Indigo Tides — 靛藍潮汐

- 深靛藍 canvas、藍黑 surface、海鹽白 ink
- 時段與日曆像夜間潮位儀表，但保持原互動
- 角色：夜海、安定、清醒的專業感

## 五、三頁如何連動

### 5.1 專屬首頁

- cover 照與內容不換；套用 theme image filter 與 overlay。
- Hero、快速預約 dock、介紹區、作品區、結尾 CTA 使用同一 recipe。
- 深色主題不插入白色介紹段；中／深色 panel 維持同色系層次。

### 5.2 預約頁

- 主頁 canvas、sticky header、服務摘要、表單 panel、日曆、時段、底部 CTA 全部改用 semantic tokens。
- `LineRequiredScreen`、`DemoCompletionScreen` 也必須被同一 theme shell 驅動。
- 完成畫面保留明暗劇場，但亮色前景改用 `--theme-on-image`，不是 background token。
- 所有 input 在深色主題仍清楚可輸入，placeholder 對比至少 4.5:1。

### 5.3 後台

- 後台不固定淡色；header、數據區、主分頁、內容 canvas 都跟主題。
- 資料密集內容以 panel/surface 層次保持可讀，不用每個主題各寫一套 markup。
- booking status 的綠／黃／紅維持功能語意，僅調整底色與邊線使其在深色 canvas 上可辨識。
- Theme picker 自身要能在目前選定主題中保持清楚，且 preview 連結在 LIFF 內正確開啟。

## 六、硬編色守門器修正

擴大 `check_theme_hardcodes.mjs` 的管理範圍：

- 舊 background/surface/border literals
- `rgba(44,40,37,...)` 類舊 ink
- `rgba(251,249,244,...)` 類舊 on-dark
- 會把 panel 永久鎖成白色的 `#fff`／`white`／`rgba(255,255,255,...)`

但掃描器要有明確 allowlist：LINE 官方綠、錯誤紅、真正的透明／圖像遮罩用途。目標不是禁止黑白，而是要求主題管理區使用 semantic token。

新增 token 測試：

- 每個 theme recipe 必須定義完整 token 集
- `theme-ink` 對 canvas/surface/panel ≥ 4.5:1
- `theme-muted` 對實際背景 ≥ 4.5:1
- `theme-accent-text` 對實際使用背景 ≥ 4.5:1
- `theme-on-accent` 對 accent strong ≥ 4.5:1

## 七、LIFF 預覽策略

- `providerThemePreviewHref()` 保持不變。
- 在 LIFF client：將相對 href 轉為絕對 URL，使用 `liff.openWindow({ url, external: false })`。
- 一般瀏覽器：保留標準 `<a href target="_blank">`。
- 如果 LIFF API 失敗：fallback 到 `window.open(url, '_blank')`。
- 若瀏覽器阻擋 popup，原始 `<a href>` 仍可由使用者直接啟動；不得以 JavaScript-only 按鈕取代可用連結。
- 不改登入、owner 驗證、preview whitelist 或儲存 API。

## 八、安全與測試

### 8.1 不得改動

- `scripts/verify_book_visual.sh` 與其邏輯指紋
- booking submit、availability、409、LINE required、demo no-write
- owner authorization
- providers AA index 與 fallback
- cover 管理權限
- migration 執行狀態

### 8.2 自動驗證

- TypeScript 0 errors
- 182+ tests 全過
- production build
- 原守門腳本全綠
- 擴充後 hardcode scanner 全綠
- invalid preview fallback
- PGRST204／42703 測試保留
- handler／fetch／href／LIFF／router 數量不得低於 `6c09d71`

### 8.3 視覺驗證

8 主題 × 3 頁 × 390/1440 = 48 組：

- data-theme 正確
- 無整頁水平 overflow
- 固定 CTA 不遮表單
- 深色 input／placeholder 可讀
- hover、focus、selected、disabled、error 狀態在淺／中／深主題都可辨識
- 空狀態、loading、LINE gate、demo completion、booking completion 都有主題
- 後台 6 個主分頁與 modal 不出現白色孤島

後台驗證若使用臨時本機 QA bypass，必須在同一工作階段還原；最終 diff 不得包含 auth/access/proxy 變更，殘留掃描必須為 0。

## 九、推出順序

1. 暫停 `6c09d71` 第一階段 production 部署。
2. 在 feature worktree 完成 semantic token 與三頁視覺升級。
3. 產出代表性 8 主題對照圖給 Gini 看感受。
4. Gini 可要求調色／明暗調整；不需重做功能。
5. 48 組與完整功能 guard 通過後，再重做 deployment gate。
6. 第一階段仍只部署程式、不跑 DDL。
7. Gini 真實 LIFF 驗收後，才討論 DDL 與持久化切換。

## 十、完成標準

- 不看主題名稱，也能從第一個 viewport 區分八種風格。
- 淺／中／深三個層級肉眼立即可辨。
- 三頁視覺一致，不再出現首頁已換色但預約／後台仍白底。
- 深色不是把背景塗黑：文字、panel、input、status、圖像遮罩形成完整層次。
- 沒有新增功能分支、資料寫入或權限面積。
- 所有回歸 gate 通過後才允許部署。
