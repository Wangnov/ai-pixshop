# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI像素工坊 - 基于React的AI驱动图片编辑器，集成Google Gemini AI进行智能图像处理。

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器（端口5192）
npm run build        # 构建生产版本
npm run preview      # 预览构建结果

# 依赖管理
npm install          # 安装依赖
```

## 技术栈

- **前端框架**: React 19.1.0 + TypeScript
- **构建工具**: Vite 6.2.0
- **AI集成**: Google Gemini AI (使用@google/genai)
- **国际化**: i18next + react-i18next（支持中文/英文切换）
- **图片裁剪**: react-image-crop 11.0.6
- **图标库**: react-icons 5.5.0
- **样式框架**: Tailwind CSS v4 (构建时处理，非CDN)

## 架构模式

### 核心组件结构
- `App.tsx` - 主应用组件，管理图片历史记录、状态和AI操作
- `components/` - UI组件模块化目录
  - `StartScreen.tsx` - 初始上传界面
  - `Header.tsx` - 应用头部（含语言和主题切换按钮）
  - `*Panel.tsx` - 各类编辑面板（滤镜、调整、裁剪）
  - `LanguageSwitcher.tsx` - 语言切换组件
  - `ThemeSwitcher.tsx` - 主题切换组件
  - `FloatingLights.tsx` - 日间模式背景动画组件
  - `EditorCanvas.tsx` - 图片编辑画布
- `contexts/` - React上下文目录
  - `ThemeContext.tsx` - 主题状态管理和持久化
- `utils/` - 工具函数目录
  - `themeStyles.ts` - 主题样式映射工具
- `services/geminiService.ts` - Gemini AI集成服务层
- `i18n/` - 国际化配置和翻译资源目录
  - `index.ts` - i18n配置和初始化
  - `zh.json` - 中文翻译资源
  - `en.json` - 英文翻译资源

### 状态管理
使用React hooks管理应用状态：
- `history[]` - 图片编辑历史记录（支持撤销/重做）
- `historyIndex` - 当前历史索引
- `activeTab` - 当前编辑模式（'retouch' | 'adjust' | 'filters' | 'crop'）
- `editHotspot` - 局部编辑点击坐标

### AI编辑工作流
1. **局部修饰**：用户点击图片区域 → 输入提示词 → 调用`generateEditedImage()`
2. **滤镜应用**：选择预设或自定义滤镜 → 调用`generateFilteredImage()`  
3. **全局调整**：设置调整参数 → 调用`generateAdjustedImage()`
4. **图片裁剪**：使用react-image-crop组件进行裁剪操作

## 环境配置

需要设置环境变量：
- `GEMINI_API_KEY` - 在`.env.local`文件中配置Gemini API密钥

## 国际化系统

### 语言支持
- **默认语言**: 中文 (zh)
- **支持语言**: 中文、英文
- **语言检测**: 自动检测浏览器语言，支持localStorage持久化

### 使用方式
- **切换语言**: 点击Header右上角的语言切换按钮
- **持久化**: 语言偏好自动保存到localStorage
- **组件使用**: 使用`useTranslation`钩子获取`t`函数进行翻译

## 主题系统

### 主题支持
- **夜间模式** (dark): 深色主题，适合暗环境使用
- **日间模式** (light): 浅色主题 + 温柔浮动光斑动画，适合明亮环境
- **自动模式** (auto): 跟随系统主题设置，自动在日间/夜间模式间切换

### 实现架构
- **状态管理**: `ThemeContext.tsx` - React Context + localStorage持久化
- **样式系统**: `themeStyles.ts` - 集中管理主题样式映射
- **组件支持**: 所有组件使用`useTheme`钩子和`getThemeStyles`工具函数

### 主题切换
- **切换方式**: 点击Header右上角的主题图标（🌙/☀️/💻）
- **循环顺序**: dark → light → auto → dark...
- **持久化**: 主题选择自动保存到localStorage
- **系统检测**: auto模式监听系统`prefers-color-scheme`变化

### 日间模式动画
- **浮动光斑**: 6个不同大小的暖色调光点（30px-120px）
- **动画效果**: 缓慢浮动 + 缩放变化（8秒循环）
- **视觉特征**: 金黄到淡蓝渐变 + 微妙模糊效果
- **性能优化**: 纯CSS动画，硬件加速，pointer-events: none

### 翻译资源结构
```
i18n/
├── index.ts          # 配置文件
├── zh.json          # 中文翻译
└── en.json          # 英文翻译
```

## 开发注意事项

### Gemini AI集成
- 使用`gemini-2.5-flash-image-preview`模型进行图像处理
- 所有AI调用都在`services/geminiService.ts`中统一管理
- 错误处理包含提示词过滤、安全检查和API响应验证

### 图片处理
- 支持拖放和文件选择上传
- 自动转换DataURL到File对象
- 使用Object URLs管理内存，自动清理防止内存泄漏
- 历史记录基于File对象数组实现

### UI/UX模式
- 四种编辑模式：修饰、调整、滤镜、裁剪
- 预设选项配合自定义输入的双重交互模式
- 实时预览和对比功能（按住查看原图）
- 响应式设计，支持移动端操作
- 多语言界面，支持中英文无缝切换

### 样式架构
- **Tailwind CSS v4**: 使用最新版本，构建时处理样式
- **响应式设计**: 移动优先的响应式布局
- **双主题支持**: 完整的日间/夜间主题系统
- **动画效果**: 流畅的过渡动画和交互反馈
- **背景特效**: 日间模式专属浮动光斑动画

### 组件设计原则
- 功能组件使用hooks模式
- Props接口明确定义类型
- 统一的加载状态和错误处理
- 可复用的UI组件（按钮、面板等）
- 完整的i18n支持，所有文本内容国际化