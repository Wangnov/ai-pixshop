/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `请求被阻止。原因: ${blockReason}。 ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `图像生成 (${context}) 意外停止。原因: ${finishReason}。这通常与安全设置有关。`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    const textFeedback = response.text?.trim();
    const errorMessage = `AI 模型没有为 ${context} 返回图像。 ` +
        (textFeedback
            ? `模型返回了文本: "${textFeedback}"`
            : "这可能是由于安全过滤器或请求过于复杂。请尝试更直接地改写您的提示。");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

// 图像生成选项类型定义
export interface GenerateOptions {
    style?: 'photo' | 'art' | 'illustration' | 'concept';
    aspectRatio?: '1:1' | '16:9' | '9:16' | 'free';
    quality?: 'draft' | 'standard' | 'high';
}

/**
 * Generates an image from text using Gemini AI
 * @param prompt The text prompt describing the desired image
 * @param options Generation options (style, aspect ratio, quality)
 * @returns A promise that resolves to the data URL of the generated image
 */
export const generateImageFromText = async (
    prompt: string,
    options: GenerateOptions = {}
): Promise<string> => {
    console.log(`Starting text-to-image generation: ${prompt}`);
    const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY!,
        httpOptions: {

        }
    });

    const { style = 'photo', aspectRatio = '1:1', quality = 'standard' } = options;

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
        'free': '自由比例'
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

    const textPart = { text: systemPrompt };

    console.log('Sending text prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [textPart] },
    });
    console.log('Received response from model for text generation.', response);

    return handleApiResponse(response, 'text-to-image');
};

/**
 * Generates an image using reference images and text prompt
 * @param prompt The text prompt describing the desired image
 * @param referenceImages Array of reference image files
 * @param options Generation options
 * @returns A promise that resolves to the data URL of the generated image
 */
export const generateWithReference = async (
    prompt: string,
    referenceImages: File[],
    options: GenerateOptions = {}
): Promise<string> => {
    console.log(`Starting reference-based generation: ${prompt} with ${referenceImages.length} references`);
    const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY!,
        httpOptions: {

        }
    });

    // Options are available but not used in reference generation

    // Convert reference images to parts
    const referenceParts = await Promise.all(referenceImages.map(fileToPart));

    const systemPrompt = `你是一位专业的AI图像生成师。基于提供的参考图像和用户描述生成新图像。

用户描述: "${prompt}"
参考图像数量: ${referenceImages.length}张

生成指南:
- 参考提供图像的风格、构图、色彩或元素
- 根据用户描述创作新的图像内容
- 融合参考图像的精髓与用户需求
- 确保结果自然、和谐、富有创意

输出: 仅返回生成的图像，不要返回文本。`;

    const textPart = { text: systemPrompt };
    const parts = [...referenceParts, textPart];

    console.log('Sending reference images and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
    });
    console.log('Received response from model for reference generation.', response);

    return handleApiResponse(response, 'reference-based');
};

/**
 * Optimizes a text prompt for better image generation results
 * @param originalPrompt The original user prompt
 * @returns A promise that resolves to an optimized prompt
 */
export const optimizePrompt = async (originalPrompt: string): Promise<string> => {
    console.log(`Starting prompt optimization: ${originalPrompt}`);
    const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY!,
        httpOptions: {

        }
    });

    const optimizationPrompt = `你是一位专业的图像生成提示词优化专家。帮助用户将简单的描述转换为能够生成高质量图像的详细提示词。

原始描述: "${originalPrompt}"

优化指南:
- 保留用户的核心意图和主要元素
- 添加具体的视觉细节（光影、色彩、构图）
- 包含风格和技法描述
- 使用专业的摄影或艺术术语
- 确保描述清晰、具体、富有表现力

请直接返回优化后的提示词，无需解释过程。`;

    console.log('Sending prompt for optimization...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: optimizationPrompt }] },
    });

    console.log('Received optimization response.', response);

    const optimizedText = response.text?.trim();
    if (!optimizedText) {
        throw new Error('提示词优化失败，未收到有效响应');
    }

    return optimizedText;
};

/**
 * Analyzes an image and provides insights for improvement
 * @param image The image file to analyze
 * @returns A promise that resolves to analysis results
 */
export const analyzeImage = async (image: File): Promise<{
    composition: string;
    colors: string;
    suggestions: string;
    improvementPrompts: string[];
}> => {
    console.log('Starting image analysis');
    const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY!,
        httpOptions: {

        }
    });

    const imagePart = await fileToPart(image);

    const analysisPrompt = `你是一位专业的图像分析师和视觉艺术专家。请详细分析这张图像并提供专业建议。

请从以下方面进行分析：
1. 构图分析：布局、平衡、焦点、视觉引导线等
2. 色彩分析：色彩搭配、饱和度、对比度、情感表达
3. 改进建议：具体的改进方向和建议

请以JSON格式返回分析结果：
{
    "composition": "构图分析内容",
    "colors": "色彩分析内容", 
    "suggestions": "改进建议内容",
    "improvementPrompts": ["改进提示1", "改进提示2", "改进提示3"]
}`;

    const textPart = { text: analysisPrompt };

    console.log('Sending image for analysis...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
    });

    console.log('Received analysis response.', response);

    const analysisText = response.text?.trim();
    if (!analysisText) {
        throw new Error('图像分析失败，未收到有效响应');
    }

    try {
        const analysisResult = JSON.parse(analysisText);
        return analysisResult;
    } catch (error) {
        console.error('Failed to parse analysis response:', analysisText);
        throw new Error('分析结果格式错误，请重试');
    }
};