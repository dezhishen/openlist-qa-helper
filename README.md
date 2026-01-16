# 引导式树形问卷组件

## 简介

本项目是一个支持递归嵌套、`custom: true`自定义选项、默认选中、搜索过滤、HTML提示、快捷输入、折叠/展开与选项概览、题型插件化扩展的互动问卷组件。无需后端即可静态部署，题目独立配置于 YAML 文件，UI 支持移动端自适应。

**主要特性：**
- 多级树形结构引导式问卷
- 支持 radio/checkbox 下 `custom: true` 自动添加"其他"输入项
- 支持选项默认选中 (`checked: true`)
- 选项数量超过6个时自动显示搜索框，方便快速定位
- 支持 HTML 格式的提示信息 (`tips` 字段)
- 输入框支持快捷输入按钮 (`quickInputs` 配置)
- radio/input 填写完成自动折叠面板，checkbox 提供"完成本题"按钮手动折叠
- 面板标题下方实时显示选项/填写概览
- 题型渲染逻辑插件式注册，开闭原则易于扩展
- 数据/界面完全分离，题库独立存于 `/data/questions.yaml`
- 可直接部署为静态页面使用

---

## 目录结构

```
.
├── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── render.js
│       ├── render_builtin/
│       │   ├── index.js
│       │   └── ...（可扩展更多类型文件）
│       ├── state.js
│       ├── validate.js
│       └── result.js
└── data/
    └── questions.yaml
```

---

## 数据配置

所有问卷内容配置在 `data/questions.yaml`，示例：

```yaml
- title: "你喜欢的水果"
  type: "checkbox"
  required: true
  custom: true
  customLabel: "其他"
  items:
    - title: "苹果"
      checked: true  # 默认选中
    - title: "香蕉"
    - title: "橘子"
    - title: "葡萄"
    - title: "西瓜"
    - title: "橙子"
    - title: "草莓"  # 超过6个选项时会自动显示搜索框

- title: "你的职业"
  type: "radio"
  required: true
  custom: true
  items:
    - title: "程序员"
      checked: true  # 默认选中
    - title: "设计师"

- title: "请描述你近期印象最深刻的产品"
  type: "input"
  inputType: "textarea"
  required: false
  placeholder: "不限于APP、网页、工具等"
  tips: "例如：微信、抖音、ChatGPT等"  # HTML格式的提示信息
  quickInputs:  # 快捷输入按钮配置
    - label: "清空"
      value: ""
    - label: "微信"
      value: "微信"
    - label: "抖音"
      value: "抖音"
```

---

## 启动与部署

1. **本地开发**  
   推荐用 VSCode 配合 Live Server 插件，或者 `npx live-server .`，否则浏览器无法直接本地读取 yaml 问卷文件。
   
2. **静态部署**  
   只需将整个目录放到 web 服务器，保持相对路径即可。

---

## 主要 JS 组件职责

```
- `render.js`          —— 面板递归构建及类型分发（插件式）
- `render_builtin/`    —— 默认支持的题型注册实现（radio/checkbox/input）
  - `index.js`
  - ...（其它子型文件可扩展）
- `state.js`           —— 全局状态存取
- `validate.js`        —— 题目必填校验与完成判定
- `result.js`          —— 问卷完成展示与复制
- `app.js`             —— 主启动、数据加载、UI流转管理
```

---

## 题型扩展

- **新增题型**  
  新建渲染函数，并用 `registerRenderer(type, fn)` 注册即可。例如，新增 `type: slider` 的方法加到 `render_builtin/slider.js` 并注册。

- **插件式注册**  
  `render.js` 负责派发，`render_builtin/index.js` 负责注册默认题型。自行扩展只需添加新文件并注册，不需改动主流程，完全遵循开闭原则。

---

## 交互体验

- **radio/input** 填写完成自动折叠面板
- **checkbox** 单独提供“完成本题”按钮，用户点击后折叠
- 面板 header 下方实时出现答题概览
- 支持 `checked: true` 设置选项默认选中状态
- 选项数量超过6个时自动显示搜索框，输入关键词实时过滤
- 支持 `tips` 字段显示 HTML 格式的提示信息，鼠标悬停查看
- 输入框支持 `quickInputs` 配置快捷输入按钮，避免重复输入

---

## 常见问题 FAQ

**Q1:** 为什么本地直接双击 index.html 无法加载问卷？  
**A1:** 浏览器安全限制无法本地直接用文件协议 (`file://`) 访问 yaml 文件，需本地服务器。

**Q2:** 如何自定义题型？  
**A2:** 在 `render_builtin/` 新建渲染函数并注册。例如：
```js
// render_builtin/shortinput.js
import { registerRenderer } from '../render.js';
function renderShortInput(q, wrap) { /* ... */ }
registerRenderer('shortinput', renderShortInput);
```
YAML 填写 `type: shortinput` 即可。

**Q3:** custom: true 的输入内容如何判断必填？  
**A3:** 只要启用 custom，并且有输入内容，校验即视为已填写。

**Q4:** 如何设置选项默认选中？  
**A4:** 在选项配置中添加 `checked: true` 字段，该选项会默认被选中。

**Q5:** 选项很多时如何快速找到？  
**A5:** 当选项数量超过6个时，会自动显示搜索框，输入关键词即可实时过滤选项。

**Q6:** 如何添加提示信息？  
**A6:** 使用 `tips` 字段，支持 HTML 格式的内容，鼠标悬停在问号图标上查看。

**Q7:** 如何配置快捷输入按钮？  
**A7:** 为 input 类型题目添加 `quickInputs` 数组，每个元素包含 `label`（按钮文本）和 `value`（填充内容）。

---

## 运行效果示例

页面如图，支持自动收起、题目概览、嵌套、其他输入、折叠按钮等：
[openlist-qa-helper](https://dezhishen.github.io/openlist-qa-helper)
---

## License

MIT