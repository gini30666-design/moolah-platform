#!/bin/bash
# 預約頁視覺改造 — 回歸守門
# 用法：bash scripts/verify_book_visual.sh
# Codex 每改完一輪就跑這支；全綠才准部署。

cd "$(dirname "$0")/.." || exit 1
unset NODE_OPTIONS
F="src/app/[providerId]/book/page.tsx"
FAIL=0
red()  { printf "\033[31m✗ %s\033[0m\n" "$1"; FAIL=1; }
green(){ printf "\033[32m✓ %s\033[0m\n" "$1"; }

echo "=== 1. TypeScript ==="
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  red "tsc 有錯誤"; npx tsc --noEmit 2>&1 | grep "error TS" | head -10
else green "tsc 0 錯誤"; fi

echo ""
echo "=== 2. 單元測試（基準 141）==="
OUT=$(npx vitest run 2>&1 | grep -E "^\s+Tests")
echo "$OUT"
echo "$OUT" | grep -q "failed" && red "有測試失敗"
N=$(echo "$OUT" | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+")
[ "${N:-0}" -lt 141 ] && red "測試數少於基準 141（現 ${N:-0}）＝有測試被刪掉" || green "測試 ${N} 個全過"

echo ""
echo "=== 3. 邏輯指紋（這些字串消失＝功能被改掉）==="
# 格式：出現次數下限:字串:說明
CHECKS=(
  "2:authHeader():送 API 的身分標頭（拿掉→401，客人約不了）"
  "1:liff.isInClient():LINE 環境判斷（拿掉→非 LINE 死循環）"
  "3:LineRequiredScreen:非 LINE 攔截畫面（拿掉→收不到提醒的預約）"
  "3:DemoCompletionScreen:示範帳號完成頁（拿掉→demo 會被當真單）"
  "5:liff.openWindow:LINE 內開連結（換成 window.open→連結打不開）"
  "10:customerPhone:電話欄位（客戶識別主鍵，8/1 重構）"
  "2:required:稱呼＋電話必填"
  "2:隱私:個資告知連結（8/14 才補，法規要求）"
  "1:/api/booking:送單端點"
  "1:/api/availability:時段查詢端點"
  "3:res.ok:寫入結果檢查（拿掉→假成功）"
  "2:409:時段被搶走的錯誤處理"
)
for c in "${CHECKS[@]}"; do
  MIN="${c%%:*}"; REST="${c#*:}"; PAT="${REST%%:*}"; DESC="${REST#*:}"
  CNT=$(grep -c -- "$PAT" "$F")
  if [ "$CNT" -lt "$MIN" ]; then red "$PAT 只剩 $CNT 個（應 ≥$MIN）— $DESC"
  else green "$PAT ×$CNT"; fi
done

echo ""
echo "=== 4. 只准動預約頁（其他檔被改就要人工確認）==="
CHANGED=$(git diff --name-only book-visual-safe-v2 -- src/ | grep -v "book/page.tsx")
if [ -n "$CHANGED" ]; then
  printf "\033[33m⚠ 預約頁以外也被改了，逐檔確認：\033[0m\n%s\n" "$CHANGED"
else green "只有 book/page.tsx 被改"; fi

echo ""
echo "=== 5. Build ==="
if npx next build > /tmp/_bookbuild.log 2>&1; then green "build 成功"
else red "build 失敗"; tail -20 /tmp/_bookbuild.log; fi

echo ""
[ $FAIL -eq 0 ] && printf "\033[32m全綠，可以部署\033[0m\n" || printf "\033[31m有紅燈，先別部署\033[0m\n"
exit $FAIL
