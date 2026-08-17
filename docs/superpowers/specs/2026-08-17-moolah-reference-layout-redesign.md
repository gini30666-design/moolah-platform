# MooLah 三頁參考圖版面重組規格

**日期：** 2026-08-17  
**狀態：** Gini 已核准開始執行  
**視覺參考：** 左為職人首頁、中為預約流程、右為後台  
**開發分支：** `codex/theme-system-v1`

## 1. 目標

以使用者提供的三支手機參考畫面為資訊架構，重新組合以下三頁：

- `/${providerId}`：照片主導的職人首頁。
- `/${providerId}/book`：淺色、緊湊、可掃讀的預約流程。
- `/${providerId}/admin`：淡色營運後台，不採參考圖的深綠滿版底。

所有文字來源、資料欄位、圖片來源、連結目標、事件處理、API 請求、驗證、LINE／LIFF 行為保持原樣。只允許調整 DOM 視覺分組、區塊順序、背景、留白、邊框、陰影、字級階層及響應式排列。

## 2. 不可改動

- 不修改任何 fetch URL、method、headers、body、effect dependency 或錯誤分支。
- 不修改 `handleBook`、`handleSubmit`、日期、時段、候補、409、LINE gate、完成頁邏輯。
- 不修改後台預約、服務、排班、作品集、候補、手動預約的資料流或事件。
- 不修改現有文字內容、資料來源、IG／隱私權／LINE／預約連結。
- 不新增參考圖中的假數字、假客戶、假作品、分享或收藏功能。
- 不執行 Supabase DDL、資料更新、部署、push 或 merge。
- 不修改 `scripts/verify_book_visual.sh`，不移動 `book-visual-safe-v2`。

## 3. 首頁

沿用現有 `ProviderProfileClient` 資料與行為，重組為：

1. 滿版封面 hero：返回、MooLah、地區、店名、IG、評分、tagline 疊於真實 `coverUrl`。
2. Hero 下緣預約 dock：現有 `nextAvail`、`fromPrice`、`handleBook`。
3. 淺色職人介紹：頭像、名稱、role/category、years、description、specialties、IG。
4. 作品／空間／活動實景：沿用 `portfolioMode`、portfolio 與 Lightbox，採兩欄圖像構圖。
5. 固定底部 CTA：沿用 `handleBook` 與起始價格，保留 safe area。

沒有封面、評分、IG、作品或服務時使用既有回退，不製造資料。

## 4. 預約流程

保持四步資料狀態與所有表單元件，重組為參考圖的淺色流程：

1. 淺色品牌 header，保留返回、職人名及步驟狀態。
2. LINE 加好友區改為低高度資訊列，連結與略過操作不變。
3. 已選服務改為橫向摘要卡；服務切換仍使用既有清單。
4. 日期改為緊湊橫向日期列；完整日期與可用性邏輯不變。
5. 時段區由深色大區塊改成淡色分組面板；每個時段狀態與候補行為不變。
6. 關於您／確認欄位維持原欄位、required、驗證與隱私文字。
7. 底部主按鈕維持原 disabled 與 submit 行為，只改呈現。

## 5. 淡色後台

保留目前 header 選單、數據、主導覽、各子頁和 modal，改成參考圖的營運密度但採淡色版本：

- 頂部：淡色品牌列＋店名＋既有選單。
- 數據：四格平面統計區，不使用深色主卡。
- 導覽：淡色 sticky tab，既有五個功能加「頁面風格」不變。
- 預約時間軸：白／淡色背景、細分隔線、狀態色只表達功能語意。
- ScheduleView、PortfolioView、ThemePickerPanel 與其他卡片全部使用 theme surface token。
- 危險、成功、LINE 綠保留原功能顏色；不拿品牌色代替狀態色。

## 6. 八主題

仍然只有一份 React 結構。八主題透過既有 `data-theme` 與 CSS token 改變 accent、背景、surface、border、hero overlay；後台在每個主題中皆維持淡色調，而不是切成深色後台。

## 7. 測試與驗收

- 先新增 source structure guard，確認三頁存在新的視覺 landmark，並保留既有功能指紋。
- 每頁各自完成 RED／GREEN 後跑 focused tests、TypeScript、硬編色掃描與原守門。
- 完成後重建 production，截取 8 主題 × 3 頁 × 390/1440；所有公開可達狀態檢查溢出、遮擋、對比與空狀態。
- 後台登入內頁若受 LINE gate 阻擋，不繞過安全機制；以真機登入補驗。

