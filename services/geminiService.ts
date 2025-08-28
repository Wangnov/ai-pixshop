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
    context: string // e.g., "edit", "filter", "adjustment"
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

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    const ai = new GoogleGenAI({ 
        apiKey: process.env.API_KEY!,
        httpOptions: {
            baseUrl: 'https://api-proxy.me/gemini'
        }
    });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `你是一位专业级照片编辑 AI。你的任务是根据用户的要求，在提供的图像上进行自然的局部编辑。
用户请求: "${userPrompt}"
编辑位置: 专注于像素坐标 (x: ${hotspot.x}, y: ${hotspot.y}) 周围的区域。

编辑指南:
- 编辑必须逼真，并与周围区域无缝融合。
- 图像的其余部分（在直接编辑区域之外）必须与原始图像保持一致。


输出: 仅返回最终编辑后的图像。不要返回文本。`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ 
        apiKey: process.env.API_KEY!,
        httpOptions: {
            baseUrl: 'https://api-proxy.me/gemini'
        }
    });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `你是一位专业级照片编辑 AI。你的任务是根据用户的要求，为整个图像应用风格化滤镜。不要改变构图或内容，只应用风格。
滤镜请求: "${filterPrompt}"

输出: 仅返回最终编辑后的图像。不要返回文本。`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ 
        apiKey: process.env.API_KEY!,
        httpOptions: {
            baseUrl: 'https://api-proxy.me/gemini'
        }
    });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `你是一位专业级照片编辑 AI。你的任务是根据用户的要求，对整个图像进行自然的全局调整。
用户请求: "${adjustmentPrompt}"

编辑指南:
- 调整必须应用于整个图像。
- 结果必须是照片般逼真的。


输出: 仅返回最终编辑后的图像。不要返回文本。`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};