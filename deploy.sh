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

# 4. 构建生产版本
echo "正在构建生产版本..."
npm run build

echo "部署完成！"
EOF

echo "部署脚本执行完毕"

