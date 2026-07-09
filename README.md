# 学校备课组管理 — 巅峰版 (Peak Edition)

基于 **V150** 的纯净单文件版本。所有 HTML/CSS/JS 内联在 `index.html`，无需构建、无外部依赖。

## 使用
直接用浏览器打开 `index.html`，或部署到任意静态托管（GitHub Pages / Cloudflare Pages / Gitee Pages）。

## 数据备份（重要）
数据保存在浏览器 `localStorage`，**按域名隔离**。换设备 / 换网址前请先用菜单「📤 导出数据」生成 JSON 备份，再到新环境「📥 导入数据」恢复。

## 版本说明
- 巅峰版 = V150：修复 V149 导入数据后 `loadOfficeList` 未定义导致页面不刷新的 ReferenceError bug
- 此仓库已从多版本历史清零为单一纯净版本
