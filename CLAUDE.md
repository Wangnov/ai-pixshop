# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI图像工坊 - 基于React的AI驱动图片编辑器，集成Google Gemini AI进行智能图像处理。

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
- **图片裁剪**: react-image-crop 11.0.6
- **图标库**: react-icons 5.5.0
- **样式**: CSS + Tailwind样式类

## 架构模式

### 核心组件结构
- `App.tsx` - 主应用组件，管理图片历史记录、状态和AI操作
- `components/` - UI组件模块化目录
  - `StartScreen.tsx` - 初始上传界面
  - `Header.tsx` - 应用头部
  - `*Panel.tsx` - 各类编辑面板（滤镜、调整、裁剪）
  - `EditorCanvas.tsx` - 图片编辑画布
- `services/geminiService.ts` - Gemini AI集成服务层

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

### 组件设计原则
- 功能组件使用hooks模式
- Props接口明确定义类型
- 统一的加载状态和错误处理
- 可复用的UI组件（按钮、面板等）