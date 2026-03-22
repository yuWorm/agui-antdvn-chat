# 主题定制

组件样式完全基于 CSS 变量，不依赖任何 UI 框架。支持三种使用方式。

## 方式一：使用内置主题

引入内置主题文件，自动获得 light/dark 双主题支持：

```ts
import "@yuworm/agui-antdvn-chat/dist/theme/variables.css";
```

通过 HTML 属性控制明暗切换：

```html
<html data-theme="light">  <!-- 亮色 -->
<html data-theme="dark">   <!-- 暗色 -->
```

## 方式二：覆盖部分变量

先引入内置主题，再在你的 CSS 中覆盖需要修改的变量：

```css
:root {
  --color-primary: #722ed1;
  --color-primary-hover: #9254de;
  --color-primary-bg: #f9f0ff;
  --color-bg: #fafafa;
}

[data-theme="dark"] {
  --color-primary-bg: #1a1325;
}
```

## 方式三：完全自定义

不引入内置主题，在宿主应用中自行定义全部变量。适合已有完整设计系统的项目。

---

## 变量清单

### 背景色

| 变量 | 说明 | Light 默认值 | Dark 默认值 |
|------|------|-------------|------------|
| `--color-bg` | 页面/组件背景 | `#ffffff` | `#141414` |
| `--color-bg-secondary` | 次级背景（附件卡片等） | `#fafafa` | `#1a1a1a` |
| `--color-bg-elevated` | 浮层背景 | `#ffffff` | `#1f1f1f` |
| `--color-bg-hover` | 悬停态背景 | `#f5f5f5` | `#2a2a2a` |
| `--color-bg-active` | 激活态背景 | `#e6f4ff` | `#111d2c` |
| `--color-bg-input` | 输入框背景 | `#ffffff` | `#1f1f1f` |
| `--color-bg-code` | 代码块背景 | `#f5f5f5` | `#2a2a2a` |
| `--color-bg-avatar` | 助手头像背景 | `#f0f5ff` | `#111d2c` |
| `--color-bg-kbd` | 键盘标签背景 | `#f5f5f5` | `#2a2a2a` |

### 文字色

| 变量 | 说明 | Light 默认值 | Dark 默认值 |
|------|------|-------------|------------|
| `--color-text-primary` | 主文字 | `#1a1a1a` | `#e8e8e8` |
| `--color-text-secondary` | 次级文字（助手消息体） | `#333333` | `#d0d0d0` |
| `--color-text-tertiary` | 三级文字 | `#666666` | `#a0a0a0` |
| `--color-text-muted` | 弱化文字（工具名等） | `#999999` | `#707070` |
| `--color-text-hint` | 提示文字（placeholder 等） | `#bbbbbb` | `#555555` |

### 边框色

| 变量 | 说明 | Light 默认值 | Dark 默认值 |
|------|------|-------------|------------|
| `--color-border` | 主边框 | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` |
| `--color-border-secondary` | 次级边框（输入框等） | `rgba(0,0,0,0.1)` | `rgba(255,255,255,0.12)` |
| `--color-border-kbd` | 键盘标签边框 | `#e8e8e8` | `#3a3a3a` |
| `--color-border-tool` | 工具卡片左边框 | `#f0f0f0` | `#2a2a2a` |
| `--color-border-table` | Markdown 表格边框 | `#e8e8e8` | `#303030` |

### 功能色

| 变量 | 说明 | Light 默认值 | Dark 默认值 |
|------|------|-------------|------------|
| `--color-primary` | 主色（发送按钮、链接等） | `#1677ff` | `#1677ff` |
| `--color-primary-hover` | 主色悬停态 | `#4096ff` | `#4096ff` |
| `--color-primary-bg` | 主色浅背景 | `#e6f4ff` | `#111d2c` |
| `--color-danger` | 危险色（拒绝、停止按钮） | `#ff4d4f` | `#ff4d4f` |
| `--color-danger-bg` | 危险色浅背景 | `#fff1f0` | `#2a1215` |
| `--color-warning-bg` | 警告背景（HIL 确认卡片） | `#fffbe6` | `#2b2111` |
| `--color-warning-border` | 警告边框 | `#ffe58f` | `#594214` |
| `--color-send-inactive` | 发送按钮未激活态 | `#d9d9d9` | `#3a3a3a` |
| `--color-thinking-dot` | Thinking 动画圆点 | `#bbbbbb` | `#555555` |
