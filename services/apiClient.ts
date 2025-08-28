/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// API客户端服务，用于与后端通信

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 生产环境使用相同域名
  : 'http://localhost:3001'; // 开发环境使用后端端口

// 辅助函数：将File对象转换为FormData
const fileToFormData = (file: File, additionalData: Record<string, any> = {}): FormData => {
  const formData = new FormData();
  formData.append('image', file);
  
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  
  return formData;
};

// 处理API响应的辅助函数
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP错误: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '未知API错误');
  }
  
  return data.imageUrl;
};

/**
 * 图像编辑API调用
 */
export const generateEditedImage = async (
  originalImage: File,
  userPrompt: string,
  hotspot: { x: number, y: number }
): Promise<string> => {
  const formData = fileToFormData(originalImage, {
    prompt: userPrompt,
    x: hotspot.x,
    y: hotspot.y
  });

  const response = await fetch(`${API_BASE_URL}/api/edit-image`, {
    method: 'POST',
    body: formData
  });

  return handleApiResponse(response);
};

/**
 * 滤镜应用API调用
 */
export const generateFilteredImage = async (
  originalImage: File,
  filterPrompt: string
): Promise<string> => {
  const formData = fileToFormData(originalImage, {
    prompt: filterPrompt
  });

  const response = await fetch(`${API_BASE_URL}/api/apply-filter`, {
    method: 'POST',
    body: formData
  });

  return handleApiResponse(response);
};

/**
 * 全局调整API调用
 */
export const generateAdjustedImage = async (
  originalImage: File,
  adjustmentPrompt: string
): Promise<string> => {
  const formData = fileToFormData(originalImage, {
    prompt: adjustmentPrompt
  });

  const response = await fetch(`${API_BASE_URL}/api/adjust-image`, {
    method: 'POST',
    body: formData
  });

  return handleApiResponse(response);
};

/**
 * 文本生成图像API调用
 */
export const generateImageFromText = async (
  prompt: string,
  options: {
    style?: 'photo' | 'art' | 'illustration' | 'concept';
    aspectRatio?: '1:1' | '16:9' | '9:16' | 'free';
    quality?: 'draft' | 'standard' | 'high';
  } = {}
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/text-to-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      ...options
    })
  });

  return handleApiResponse(response);
};

/**
 * 提示词优化API调用
 */
export const optimizePrompt = async (originalPrompt: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/optimize-prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: originalPrompt
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP错误: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '未知API错误');
  }
  
  return data.optimizedPrompt;
};

/**
 * 健康检查API调用
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    return data.status === 'OK';
  } catch (error) {
    console.error('健康检查失败:', error);
    return false;
  }
};