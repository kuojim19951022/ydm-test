#!/bin/bash
# ╔══════════════════════════════════════════════════╗
# ║   SCSS 一次性編譯腳本                              ║
# ║   使用方法: ./compile-scss.sh                     ║
# ╚══════════════════════════════════════════════════╝

cd "$(dirname "$0")"

# ── 設定區 ───────────────
SCSS_FILE="main"              
# ────────────────────────────────────────────────────

# ── 主流程 ───────────────────────────────────────────

echo ""
echo "🔨 正在編譯 SCSS..."
echo "   來源: src/scss/${SCSS_FILE}.scss"
echo "   輸出: dist/css/${SCSS_FILE}.css"
echo ""

npx -y sass src/scss/${SCSS_FILE}.scss:dist/css/${SCSS_FILE}.css --style compressed

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 編譯成功！"
    echo ""
    echo "🎉 完成！"
    echo ""
else
    echo ""
    echo "❌ 編譯失敗！請檢查 SCSS 語法"
    echo ""
    exit 1
fi
