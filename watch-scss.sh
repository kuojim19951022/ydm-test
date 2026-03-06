#!/bin/bash
# ╔══════════════════════════════════════════════════╗
# ║   SCSS 監聽模式 + 自動編譯腳本                     ║
# ║   使用方法: ./watch-scss.sh                      ║
# ╚══════════════════════════════════════════════════╝

cd "$(dirname "$0")"

# ── 設定區 ───────────────
SCSS_FILE="main"              
# ────────────────────────────────────────────────────

# ── 主流程 ───────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   🔍 SCSS 監聽模式已啟動                          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  📁 監聽: src/scss/**/*.scss"
echo "  📄 輸出: dist/css/${SCSS_FILE}.css"
echo ""
echo "  💡 修改 SCSS 檔案後，將自動編譯"
echo "     按 Ctrl+C 停止監聽"
echo ""
echo "────────────────────────────────────────────────"
echo ""

# 使用 process substitution（避免 subshell 問題）
# sass 每次編譯成功後會輸出 "Compiled xxx to xxx."
while IFS= read -r line; do
    echo "$line"

    # sass 編譯成功訊息格式: "[時間] Compiled src/scss/${SCSS_FILE}.scss to dist/css/${SCSS_FILE}.css."
    # 或: "Compiled src/scss/${SCSS_FILE}.scss to dist/css/${SCSS_FILE}.css."
    if echo "$line" | grep -qiE "(^\[.*\]\s+)?Compiled.*to.*${SCSS_FILE}\.css"; then
        echo ""
        echo "✅ [$(date '+%H:%M:%S')] 編譯完成！"
        echo "────────────────────────────────────────────────"
        echo ""
    fi

    # sass 輸出 Error 時顯示提示
    if echo "$line" | grep -qi "^Error"; then
        echo "  ⚠️  請修正 SCSS 語法錯誤後存檔，將自動重新嘗試"
        echo ""
    fi

done < <(npx -y sass --watch src/scss/${SCSS_FILE}.scss:dist/css/${SCSS_FILE}.css --style compressed 2>&1)
