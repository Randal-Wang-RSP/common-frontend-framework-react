---
description: "Test: dev→planner workflow with a small single-chunk task"
agent: dev
---

在页面顶部添加一个全局通知栏组件。

## 需求描述

- 在所有页面顶部显示一条通知消息（支持 info / warning / error 三种类型）
- 通知栏可以通过 Zustand store 控制显示/隐藏和内容
- 通知栏有关闭按钮，关闭后 5 秒内不再显示相同通知
- 使用 Ant Design Alert 组件封装

## 验收标准

1. 调用 `showNotification({ type, message })` 后页面顶部出现通知
2. 点击关闭按钮通知消失
3. 5 秒内重复调用相同消息不会重复显示
