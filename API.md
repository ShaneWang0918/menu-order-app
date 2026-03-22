# API 结构

当前接口已经按“公开点餐”和“后台管理”两类整理。

## 公开接口

这些接口给首页和后续微信小程序使用，不需要后台登录。

- `GET /api/public/app-state`
  获取首页点餐需要的基础数据：
  - `dishes`
  - `users`
  - `orderState`

- `PUT /api/public/order-state`
  更新当前点餐状态：
  - `selectedDate`
  - `items`

- `POST /api/public/orders`
  根据当前 `orderState` 和传入的 `userId` 建立一笔订单，并自动清空当前已选菜品

## 后台管理接口

这些接口需要先登录后台。

### 登录相关

- `GET /api/admin/auth/session`
- `POST /api/admin/auth/login`
- `DELETE /api/admin/auth/logout`

### 管理数据

- `GET /api/admin/app-state`
  获取后台页面需要的完整数据

- `GET /api/admin/orders`
  获取订单历史

- `PUT /api/admin/dishes`
  更新菜品列表

- `PUT /api/admin/users`
  更新用户列表

- `POST /api/admin/orders/complete-date`
  按日期把订单标记为已完成

- `POST /api/admin/uploads/images`
  上传菜品图片

## 兼容说明

旧接口目前仍保留，以免打断已有功能。
后续如果这套新接口稳定，我们可以在下一阶段把旧接口逐步下线。
