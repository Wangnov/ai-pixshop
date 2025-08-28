/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeStyles } from '../../utils/themeStyles';
import { generateImageFromText, optimizePrompt } from '../../services/apiClient';
import { GenerateOptions } from '../../services/geminiDrawService';
import Spinner from '../Spinner';

interface TextToImagePanelProps {
  onImageGenerated: (imageFile: File) => void;
  onUseAsReference: (imageFile: File) => void;
  onSwitchToEdit: (imageFile: File) => void;
  initialPrompt?: string;
}

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
};

const TextToImagePanel: React.FC<TextToImagePanelProps> = ({ 
  onImageGenerated, 
  onUseAsReference, 
  onSwitchToEdit,
  initialPrompt = ''
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  // Generation options
  const [style, setStyle] = useState<GenerateOptions['style']>('photo');
  const [aspectRatio, setAspectRatio] = useState<GenerateOptions['aspectRatio']>('1:1');
  const [quality, setQuality] = useState<GenerateOptions['quality']>('high');

  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  const presets = [
    { name: t('draw.textToImage.presets.landscape'), prompt: '壮丽的自然风光，群山环绕，湖水清澈，朝阳初升，色彩丰富' },
    { name: t('draw.textToImage.presets.portrait'), prompt: '专业人像摄影，柔和光线，背景虚化，表情自然，细节清晰' },
    { name: t('draw.textToImage.presets.abstract'), prompt: '抽象艺术作品，色彩流动，形状几何，富有创意和想象力' },
    { name: t('draw.textToImage.presets.anime'), prompt: '日本动漫风格，线条清晰，色彩鲜艳，人物可爱，背景精美' },
  ];

  const activePrompt = optimizedPrompt || prompt;

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    setOptimizedPrompt(null);
    setError(null);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setOptimizedPrompt(null);
    setError(null);
  };

  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) {
      setError(t('draw.errors.noPrompt'));
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const optimized = await optimizePrompt(prompt);
      setOptimizedPrompt(optimized);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(t('draw.errors.optimizeFailed', { error: errorMessage }));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerate = async () => {
    if (!activePrompt.trim()) {
      setError(t('draw.errors.noPrompt'));
      return;
    }

    setIsGenerating(true);
    setError(null);

    const options: GenerateOptions = { style, aspectRatio, quality };

    try {
      const imageUrl = await generateImageFromText(activePrompt, options);
      setGeneratedImageUrl(imageUrl);
      const imageFile = dataURLtoFile(imageUrl, `generated-${Date.now()}.png`);
      onImageGenerated(imageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(t('draw.errors.generateFailed', { error: errorMessage }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseOptimized = () => {
    if (optimizedPrompt) {
      setPrompt(optimizedPrompt);
      setOptimizedPrompt(null);
    }
  };

  return (
    <div className={`w-full ${styles.bg.tertiary} ${styles.border.primary} border rounded-lg p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-sm transition-colors duration-300`}>
      <h3 className={`text-xl font-semibold text-center ${styles.text.primary}`}>
        {t('draw.textToImage.title')}
      </h3>

      {/* 预设按钮 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isGenerating || isOptimizing}
            className={`text-center ${styles.interactive.default} border border-transparent ${styles.text.input} font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out ${styles.interactive.hover} hover:border-opacity-20 ${styles.interactive.pressed} text-base disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* 提示词输入 */}
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={handlePromptChange}
          placeholder={t('draw.textToImage.placeholder')}
          rows={3}
          className={`w-full ${styles.bg.solid} ${styles.border.primary} border ${styles.text.input} rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60 text-base resize-none`}
          disabled={isGenerating || isOptimizing}
        />

        {/* 优化提示词 */}
        <div className="flex gap-3">
          <button
            onClick={handleOptimizePrompt}
            disabled={isGenerating || isOptimizing || !prompt.trim()}
            className={`flex-1 ${styles.interactive.default} ${styles.border.primary} border ${styles.text.input} font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out ${styles.interactive.hover} ${styles.interactive.pressed} text-base disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isOptimizing ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                {t('draw.optimization.optimizing')}
              </span>
            ) : (
              t('draw.textToImage.optimizeButton')
            )}
          </button>
        </div>

        {/* 优化结果显示 */}
        {optimizedPrompt && (
          <div className={`${styles.bg.panel} ${styles.border.primary} border rounded-lg p-4 animate-fade-in`}>
            <p className={`text-sm font-medium mb-2 ${styles.text.secondary}`}>
              {t('draw.optimization.optimized')}
            </p>
            <p className={`text-sm ${styles.text.tertiary} mb-3`}>{optimizedPrompt}</p>
            <div className="flex gap-2">
              <button
                onClick={handleUseOptimized}
                className="flex-1 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 text-sm"
              >
                {t('draw.optimization.useOptimized')}
              </button>
              <button
                onClick={() => setOptimizedPrompt(null)}
                className={`flex-1 ${styles.interactive.default} ${styles.border.primary} border ${styles.text.input} font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm`}
              >
                {t('draw.optimization.keepOriginal')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 生成选项 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 风格选择 */}
        <div className="space-y-2">
          <label className={`text-sm font-medium ${styles.text.tertiary}`}>
            {t('draw.textToImage.styles')}
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as GenerateOptions['style'])}
            disabled={isGenerating}
            className={`w-full ${styles.bg.solid} ${styles.border.primary} border ${styles.text.input} rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm`}
          >
            <option value="photo">{t('draw.textToImage.styleOptions.photo')}</option>
            <option value="art">{t('draw.textToImage.styleOptions.art')}</option>
            <option value="illustration">{t('draw.textToImage.styleOptions.illustration')}</option>
            <option value="concept">{t('draw.textToImage.styleOptions.concept')}</option>
          </select>
        </div>

        {/* 宽高比选择 */}
        <div className="space-y-2">
          <label className={`text-sm font-medium ${styles.text.tertiary}`}>
            {t('crop.aspectRatio')}
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as GenerateOptions['aspectRatio'])}
            disabled={isGenerating}
            className={`w-full ${styles.bg.solid} ${styles.border.primary} border ${styles.text.input} rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm`}
          >
            <option value="1:1">{t('draw.textToImage.aspectRatios.square')}</option>
            <option value="16:9">{t('draw.textToImage.aspectRatios.widescreen')}</option>
            <option value="9:16">{t('draw.textToImage.aspectRatios.portrait')}</option>
            <option value="free">{t('draw.textToImage.aspectRatios.free')}</option>
          </select>
        </div>

        {/* 质量选择 */}
        <div className="space-y-2">
          <label className={`text-sm font-medium ${styles.text.tertiary}`}>
            {t('draw.textToImage.quality')}
          </label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as GenerateOptions['quality'])}
            disabled={isGenerating}
            className={`w-full ${styles.bg.solid} ${styles.border.primary} border ${styles.text.input} rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm`}
          >
            <option value="draft">{t('draw.textToImage.qualityOptions.draft')}</option>
            <option value="standard">{t('draw.textToImage.qualityOptions.standard')}</option>
            <option value="high">{t('draw.textToImage.qualityOptions.high')}</option>
          </select>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg animate-fade-in">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || isOptimizing || !activePrompt.trim()}
        className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            {t('draw.results.generating')}
          </span>
        ) : (
          t('draw.textToImage.generateButton')
        )}
      </button>

      {/* 生成结果显示 */}
      {generatedImageUrl && (
        <div className={`${styles.bg.panel} ${styles.border.primary} border rounded-lg p-4 animate-fade-in`}>
          <div className="text-center space-y-4">
            <img
              src={generatedImageUrl}
              alt="Generated"
              className="max-w-full h-auto rounded-lg mx-auto max-h-96 object-contain"
            />
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => onUseAsReference(dataURLtoFile(generatedImageUrl, `generated-${Date.now()}.png`))}
                className={`${styles.interactive.default} ${styles.border.primary} border ${styles.text.input} font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm`}
              >
                {t('draw.results.useAsReference')}
              </button>
              <button
                onClick={() => onSwitchToEdit(dataURLtoFile(generatedImageUrl, `generated-${Date.now()}.png`))}
                className="bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 text-sm"
              >
                {t('draw.results.editThis')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToImagePanel;