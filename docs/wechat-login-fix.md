# 微信扫码与桌面头像快捷登录修复

后端目录：`D:/ranran_program/clouddrawing`。

截图中的 `E11000 ... email_1 ... email: null` 表示数据库仍保留旧邮箱唯一索引。修改 Mongoose 的 sparse 声明不会替换既有索引。此次改为只索引字符串邮箱，缺失字段和历史 null 不参与唯一性检查。

## 部署步骤

在后端项目目录、使用生产环境数据库配置执行：

```sh
npx ts-node scripts/migrate-user-email-index.ts
```

脚本先建立 `email_unique_string` 唯一索引，成功后才移除旧 `email_1`，可重复执行。若新索引构建失败，旧索引保留，应检查错误后处理，不要直接删除唯一约束。脚本不修改用户数据或积分。

完成迁移后编译并部署后端，再部署前端。仅更新前端不能解决数据库冲突。本次未连接生产数据库、执行迁移或部署。

## 行为变化

- 网站 `snsapi_login` 授权也请求昵称、头像和 UnionID，兼容扫码和桌面微信头像快捷授权。
- 当 UnionID 仅由用户信息接口返回时，也用它查找已有账号。
- 登录成功沿用项目的 history 路由返回来源页面。

## 验证

后端：`node --test scripts/test-wechat-login.cjs`、`npx tsc --noEmit`。

前端：`npx eslint src/views/WeChatCallback.vue`。

上线后需用真实微信账号分别验证扫码与桌面头像快捷登录，以及两个无邮箱的新用户注册；已有账号应复用原用户 ID 和积分。自动化测试使用模拟微信响应，未执行真实微信授权。
