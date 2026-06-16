#!/bin/bash
# 前端代码部署脚本
# 使用方法: ./deploy.sh

echo "开始部署前端代码到服务器..."

# 1. 登录服务器并执行部署命令
ssh ubuntu@119.45.172.191 << 'EOF'
cd /home/ubuntu/www/illustration

echo "当前目录: $(pwd)"
echo "当前分支: $(git branch --show-current)"

# 2. 拉取最新代码
echo "正在拉取最新代码..."
git pull origin main

# 检查是否有冲突
if [ $? -ne 0 ]; then
    echo "警告: git pull 可能遇到冲突，请手动解决"
    exit 1
fi

# 3. 安装依赖（如果需要）
echo "正在安装依赖..."
npm install

# 4. 构建生产版本（清空 dist，避免旧 chunk 残留导致 hash 不一致）
echo "正在构建生产版本..."
rm -rf dist
npm run build

if [ ! -f dist/index.html ] || [ ! -d dist/js ]; then
    echo "错误: 构建产物不完整"
    exit 1
fi
echo "构建产物: $(ls dist/js/*.js 2>/dev/null | wc -l) 个 JS 文件"

# 5. 校验懒加载 chunk 存在且为 JS（非 index.html 回退）
UPLOAD_BOOK_CHUNK=$(ls dist/js/upload-local-book.*.js 2>/dev/null | head -1)
if [ -z "$UPLOAD_BOOK_CHUNK" ]; then
  echo "警告: 未找到 upload-local-book chunk"
else
  echo "upload-local-book chunk: $(basename "$UPLOAD_BOOK_CHUNK")"
  if head -c 20 "$UPLOAD_BOOK_CHUNK" | grep -q '<'; then
    echo "错误: chunk 文件内容异常（像 HTML）"
    exit 1
  fi
fi

echo ""
echo "部署完成！若用户仍 ChunkLoadError："
echo "  1. 强刷 Ctrl+Shift+R 或清除站点缓存"
echo "  2. 检查 Caddy：缺失 /js/*.js 勿回退 index.html（见 deploy/caddy-static.snippet）"
echo "  3. index.html 应 no-cache，/js/* 可长期缓存"
EOF

echo "部署脚本执行完毕"

