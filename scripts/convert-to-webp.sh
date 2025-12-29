#!/bin/bash
# 将 PNG 图片转换为 WebP 格式
# 需要先安装 webp 工具: brew install webp

PROMPT_DIR="src/assets/prompt"

if ! command -v cwebp &> /dev/null; then
    echo "错误: 未找到 cwebp 工具"
    echo "请先安装 webp 工具: brew install webp"
    exit 1
fi

cd "$(dirname "$0")/.." || exit 1

echo "开始转换 PNG 图片为 WebP 格式..."
echo ""

for png_file in "$PROMPT_DIR"/*.png; do
    if [ -f "$png_file" ]; then
        webp_file="${png_file%.png}.webp"
        echo "转换: $(basename "$png_file") -> $(basename "$webp_file")"
        cwebp -q 80 "$png_file" -o "$webp_file" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "  ✓ 成功"
        else
            echo "  ✗ 失败"
        fi
    fi
done

echo ""
echo "转换完成！"
echo ""
echo "文件大小对比:"
du -sh "$PROMPT_DIR"/*.png 2>/dev/null | head -3
du -sh "$PROMPT_DIR"/*.webp 2>/dev/null | head -3

