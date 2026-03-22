# 线上部署说明

这个项目现在已经可以作为一个标准的 Node/Express 服务部署到云端。

## 当前状态

- 前端页面由 `public/` 提供
- 后端入口是 `server.js`
- 线上端口会自动读取 `PORT`
- 当前数据保存在 SQLite 数据库 `data/app.db`
- 如果项目里已有旧的 `data/store.json`，服务首次启动时会自动迁移数据
- 管理后台密码支持环境变量 `ADMIN_PASSWORD`
- Node 版本已显式锁定为 `20.18.0`，避免原生模块在高版本运行时下不兼容

## 本地启动

```bash
npm install
npm start
```

默认本地地址：

```text
http://localhost:3000
```

## Render 部署建议

创建一个新的 Web Service，使用以下配置：

- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

部署后，Render 会自动提供 `PORT` 环境变量，当前代码已经支持。

如果你使用本项目里的 [render.yaml](/Users/shixianwang/Desktop/menu-order-app/render.yaml)，这些基础配置可以直接复用。

## 推荐环境变量

- `NODE_ENV=production`
- `NODE_VERSION=20.18.0`
- `ADMIN_PASSWORD=544986911`
- `DATA_DIR=/var/data`
- `UPLOADS_DIR=/var/data/uploads`

## 上线前的重要提醒

这个项目现在使用 SQLite 和本地上传图片，所以线上环境必须考虑“数据是否会在重启后保留”。

如果你的部署平台文件系统是临时的：

- `data/app.db` 可能在重新部署后丢失
- `uploads/` 里的图片也可能丢失

如果你部署到 Render，建议把数据目录指到持久磁盘挂载路径，例如：

- `DATA_DIR=/var/data`
- `UPLOADS_DIR=/var/data/uploads`

这样数据库文件和上传图片都会写到持久目录里。后续更稳的做法仍然是把图片迁到对象存储。

## 重要提醒

当前版本虽然已经适合部署，但资料仍然写在本地 SQLite 文件：

- `data/app.db`

这已经比 JSON 文件稳定很多，适合演示、测试和早期上线。
如果后面用户量再变大，仍然建议升级到正式云数据库。

下一步建议：

1. 整理 API，统一公开接口和管理接口的边界
2. 把图片上传迁到更稳定的云存储
3. 如果准备做小程序，再基于整理后的 API 做微信前端
