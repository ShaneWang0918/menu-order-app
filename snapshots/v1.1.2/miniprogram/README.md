# 微信小程序前端

这是基于当前公开 API 搭出来的最小可用微信小程序骨架。

## 当前范围

当前只做“点餐前台”，不包含后台管理。

已接好的功能：

- 读取菜单
- 读取订餐人
- 选择未来 7 天日期
- 加入今日订单
- 移除一份菜品
- 提交订单

## 使用前要改的地方

打开 [config.js](/Users/shixianwang/Desktop/menu-order-app/miniprogram/config.js)，把：

```js
https://your-domain.com
```

改成你正式部署后的公网域名。

例如：

```js
https://your-app.onrender.com
```

## 真机联调前的注意事项

微信小程序需要把以下域名加入合法域名名单：

- `request` 合法域名
- `downloadFile` / `image` 合法域名

因为小程序会请求：

- `/api/public/app-state`
- `/api/public/order-state`
- `/api/public/orders`
- `/uploads/...`

## 下一步建议

下一阶段可以继续做：

1. 订单提交成功页
2. 我的订单记录页
3. 用户身份选择优化
4. 与正式上线域名联调
