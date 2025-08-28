/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// 加载环境变量
config({ path: '.env.server' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5192;

// 配置CORS
app.use(cors({
  origin: ['http://localhost:5192', 'http://localhost:5193', 'http://localhost:5194', 'https://pixshop.langteh.com'],
  credentials: true
}));

// 配置JSON解析
app.use(express.json({ limit: '50mb' }));

// 配置Multer用于内存存储
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('只允许上传图片文件'), false);
    }
    cb(null, true);
  }
});

// 初始化Gemini AI
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// 辅助函数：将文件转换为Gemini API格式
const fileToGeminiPart = (buffer, mimeType) => ({
  inlineData: {
    mimeType,
    data: buffer.toString('base64')
  }
});

// 处理API响应的辅助函数
const handleApiResponse = (response, context) => {
  if (response.promptFeedback?.blockReason) {
    const { blockReason, blockReasonMessage } = response.promptFeedback;
    throw new Error(`请求被阻止。原因: ${blockReason}。 ${blockReasonMessage || ''}`);
  }

  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    console.log(`收到图像数据 (${mimeType}) for ${context}`);
    return `data:${mimeType};base64,${data}`;
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`图像生成 (${context}) 意外停止。原因: ${finishReason}。这通常与安全设置有关。`);
  }
  
  const textFeedback = response.text?.trim();
  const errorMessage = `AI 模型没有为 ${context} 返回图像。 ` + 
    (textFeedback 
      ? `模型返回了文本: "${textFeedback}"`
      : "这可能是由于安全过滤器或请求过于复杂。请尝试更直接地改写您的提示。");

  throw new Error(errorMessage);
};

// API路由

// 1. 图像编辑API
app.post('/api/edit-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '需要上传图片文件' });
    }

    const { prompt, x, y } = req.body;
    if (!prompt || x === undefined || y === undefined) {
      return res.status(400).json({ error: '缺少必要参数：prompt, x, y' });
    }

    const imagePart = fileToGeminiPart(req.file.buffer, req.file.mimetype);
    
    const systemPrompt = `你是一位专业级照片编辑 AI。你的任务是根据用户的要求，在提供的图像上进行自然的局部编辑。
用户请求: "${prompt}"
编辑位置: 专注于像素坐标 (x: ${x}, y: ${y}) 周围的区域。

编辑指南:
- 编辑必须逼真，并与周围区域无缝融合。
- 图像的其余部分（在直接编辑区域之外）必须与原始图像保持一致。

输出: 仅返回最终编辑后的图像。不要返回文本。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, { text: systemPrompt }] }
    });

    const resultDataUrl = handleApiResponse(response, 'edit');
    res.json({ success: true, imageUrl: resultDataUrl });

  } catch (error) {
    console.error('图像编辑错误:', error);
    res.status(500).json({ 
      error: '图像编辑失败', 
      details: error.message 
    });
  }
});

// 2. 滤镜应用API
app.post('/api/apply-filter', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '需要上传图片文件' });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '缺少滤镜提示词' });
    }

    const imagePart = fileToGeminiPart(req.file.buffer, req.file.mimetype);
    
    const systemPrompt = `你是一位专业级照片编辑 AI。你的任务是根据用户的要求，为整个图像应用风格化滤镜。不要改变构图或内容，只应用风格。
滤镜请求: "${prompt}"

输出: 仅返回最终编辑后的图像。不要返回文本。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, { text: systemPrompt }] }
    });

    const resultDataUrl = handleApiResponse(response, 'filter');
    res.json({ success: true, imageUrl: resultDataUrl });

  } catch (error) {
    console.error('滤镜应用错误:', error);
    res.status(500).json({ 
      error: '滤镜应用失败', 
      details: error.message 
    });
  }
});

// 3. 全局调整API
app.post('/api/adjust-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '需要上传图片文件' });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '缺少调整提示词' });
    }

    const imagePart = fileToGeminiPart(req.file.buffer, req.file.mimetype);
    
    const systemPrompt = `你是一位专业级照片编辑 AI。你的任务是根据用户的要求，对整个图像进行自然的全局调整。
用户请求: "${prompt}"

编辑指南:
- 调整必须应用于整个图像。
- 结果必须是照片般逼真的。

输出: 仅返回最终编辑后的图像。不要返回文本。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, { text: systemPrompt }] }
    });

    const resultDataUrl = handleApiResponse(response, 'adjustment');
    res.json({ success: true, imageUrl: resultDataUrl });

  } catch (error) {
    console.error('图像调整错误:', error);
    res.status(500).json({ 
      error: '图像调整失败', 
      details: error.message 
    });
  }
});

// 4. 文本生成图像API
app.post('/api/text-to-image', async (req, res) => {
  try {
    const { prompt, style = 'photo', aspectRatio = '1:1', quality = 'high' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: '缺少图像描述' });
    }

    const styleInstructions = {
      photo: '以摄影写实风格',
      art: '以艺术绘画风格',
      illustration: '以插画风格',
      concept: '以概念设计风格'
    };

    const aspectInstructions = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      'free': 'natural aspect ratio'
    };

    const qualityInstructions = {
      draft: '快速生成',
      standard: '标准品质',
      high: '高品质细节'
    };

    const systemPrompt = `你是一位专业的AI图像生成师。根据用户的描述生成高质量图像。

用户描述: "${prompt}"
风格要求: ${styleInstructions[style]}
画面比例: ${aspectInstructions[aspectRatio]}
品质要求: ${qualityInstructions[quality]}

生成指南:
- 严格按照用户描述的内容和场景生成图像
- 确保构图合理，光影自然
- 细节丰富，色彩和谐
- 符合指定的风格和品质要求

输出: 仅返回生成的图像，不要返回文本。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [{ text: systemPrompt }] }
    });

    const resultDataUrl = handleApiResponse(response, 'text-to-image');
    res.json({ success: true, imageUrl: resultDataUrl });

  } catch (error) {
    console.error('文本生成图像错误:', error);
    res.status(500).json({ 
      error: '图像生成失败', 
      details: error.message 
    });
  }
});

// 5. 提示词优化API
app.post('/api/optimize-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: '缺少原始提示词' });
    }

    const optimizationPrompt = `你是一位专业的图像生成提示词优化专家。帮助用户将简单的描述转换为能够生成高质量图像的详细提示词。

原始描述: "${prompt}"

优化指南:
- 保留用户的核心意图和主要元素
- 添加具体的视觉细节（光影、色彩、构图）
- 包含风格和技法描述
- 使用专业的摄影或艺术术语
- 确保描述清晰、具体、富有表现力

请直接返回优化后的提示词，无需解释过程。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: optimizationPrompt }] }
    });

    const optimizedText = response.text?.trim();
    if (!optimizedText) {
      throw new Error('提示词优化失败，未收到有效响应');
    }

    res.json({ success: true, optimizedPrompt: optimizedText });

  } catch (error) {
    console.error('提示词优化错误:', error);
    res.status(500).json({ 
      error: '提示词优化失败', 
      details: error.message 
    });
  }
});

// 静态文件服务（用于生产环境）
app.use(express.static(path.join(__dirname, 'dist')));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI像素工坊后端服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`📱 前端资源: http://0.0.0.0:${PORT}`);
  console.log(`🔧 API端点: http://0.0.0.0:${PORT}/api/*`);
});