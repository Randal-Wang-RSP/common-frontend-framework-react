---
description: "Test: dev→planner workflow with Figma-driven UI task"
agent: dev
---

实现用户个人资料页面 --figma https://figma.com/design/FAKE_TEST_URL

## 需求描述

- 用户头像展示（圆形，支持默认占位图）
- 用户基本信息卡片（姓名、邮箱、角色、注册日期）
- 编辑按钮，点击后切换为编辑模式（inline editing）
- 头像上传功能（支持 jpg/png，最大 2MB，裁剪为正方形）
- 响应式布局：桌面端左右结构，移动端上下结构

## 验收标准

1. 页面展示用户头像和基本信息
2. 点击编辑可以修改姓名（邮箱不可修改）
3. 可以上传新头像，有尺寸和格式校验
4. 移动端布局正常
