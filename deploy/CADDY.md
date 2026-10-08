# Caddy 配置与重载

KidStory 前端静态文件目录：`/home/ubuntu/www/illustration/dist`

完整配置示例见 [`Caddyfile.example`](./Caddyfile.example)。

构建会输出首页、AI 绘本介绍和教程的静态正文，以及其他固定公开页的独立元信息。服务规则须优先匹配 `{path}/index.html`，再匹配 `{path}`，最后使用 `/app.html` 作为 Vue History 路由外壳。不要将 SPA fallback 指向带首页 canonical 的 `/index.html`。`app.html` 与所有公开页均由正常生产构建生成，无需额外安装浏览器或运行内容接口。

## 1. SSH 登录

```bash
ssh ubuntu@119.45.172.191
```

## 2. 查看现有配置

```bash
sudo cat /etc/caddy/Caddyfile
ls /etc/caddy/Caddyfile.d/ 2>/dev/null
```

## 3. 备份并编辑

```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d)
sudo nano /etc/caddy/Caddyfile
```

将 `www.kidstory.cc { ... }` 块替换为 `Caddyfile.example` 中的内容（或合并 `@static` + `try_files` 两段 `handle`）。

## 4. 校验

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

必须看到有效配置后再 reload。

## 5. 重载（推荐，不中断）

```bash
sudo systemctl reload caddy
sudo systemctl status caddy
```

失败时可重启：

```bash
sudo systemctl restart caddy
```

## 6. 手动验证

```bash
SITE=https://www.kidstory.cc

curl -I "$SITE/"
curl -I "$SITE/books"
curl -I "$SITE/blog"
curl -I "$SITE/sitemap.xml"

# 真实 JS 应 200
curl -I "$SITE/js/$(ls /home/ubuntu/www/illustration/dist/js/*.js | head -1 | xargs basename)"

# 不存在的 JS 必须 404（不能 200 + HTML）
curl -I "$SITE/js/__missing__.js"
```

## 7. 与前端部署顺序

1. 先更新 Caddy 并 `reload`
2. 再运行 `./deploy.sh` 构建并发布 `dist`
3. 若已切换 Vue History 模式，部署后 GSC 重新提交 sitemap

## 回滚

```bash
sudo cp /etc/caddy/Caddyfile.bak.YYYYMMDD /etc/caddy/Caddyfile
sudo systemctl reload caddy
```
