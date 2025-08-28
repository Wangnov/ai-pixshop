/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeStyles } from '../../utils/themeStyles';
import { generateWithReference, GenerateOptions } from '../../services/geminiDrawService';
import Spinner from '../Spinner';

interface ReferencePanelProps {
  onImageGenerated: (imageFile: File) => void;
  onSwitchToEdit: (imageFile: File) => void;
  initialReferenceImage?: File | null;
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

const ReferencePanel: React.FC<ReferencePanelProps> = ({ 
  onImageGenerated, 
  onSwitchToEdit,
  initialReferenceImage
}) => {
  const [referenceImages, setReferenceImages] = useState<File[]>(
    initialReferenceImage ? [initialReferenceImage] : []
  );
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    for (let i = 0; i < Math.min(files.length, 3 - referenceImages.length); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    }
    
    setReferenceImages(prev => [...prev, ...validFiles]);
    setError(null);
  }, [referenceImages.length]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (referenceImages.length === 0) {
      setError(t('draw.errors.noReference'));
      return;
    }

    if (!prompt.trim()) {
      setError(t('draw.errors.noPrompt'));
      return;
    }

    setIsGenerating(true);
    setError(null);

    const options: GenerateOptions = {
      style: 'photo',
      aspectRatio: '1:1',
      quality: 'standard'
    };

    try {
      const imageUrl = await generateWithReference(prompt, referenceImages, options);
      setGeneratedImageUrl(imageUrl);
      const imageFile = dataURLtoFile(imageUrl, `reference-generated-${Date.now()}.png`);
      onImageGenerated(imageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(t('draw.errors.generateFailed', { error: errorMessage }));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`w-full ${styles.bg.tertiary} ${styles.border.primary} border rounded-lg p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-sm transition-colors duration-300`}>
      <h3 className={`text-xl font-semibold text-center ${styles.text.primary}`}>
        {t('draw.reference.title')}
      </h3>

      {/* 参考图像上传区域 */}
      <div 
        className={`border-2 border-dashed ${referenceImages.length > 0 ? styles.border.primary : 'border-gray-400'} rounded-lg p-6 text-center transition-colors duration-200 hover:border-blue-400`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={referenceImages.length >= 3}
        />
        
        {referenceImages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-4xl">🖼️</div>
            <div>
              <p className={`text-lg font-medium ${styles.text.primary}`}>
                {t('draw.reference.uploadReference')}
              </p>
              <p className={`text-sm ${styles.text.tertiary} mt-1`}>
                {t('draw.reference.maxImages')}
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40"
              disabled={isGenerating}
            >
              选择图像
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 已上传的参考图像 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {referenceImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => removeReferenceImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                    disabled={isGenerating}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {referenceImages.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`${styles.interactive.default} ${styles.border.primary} border ${styles.text.input} font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm`}
                disabled={isGenerating}
              >
{t('draw.reference.uploadReference')} ({referenceImages.length}/3)
              </button>
            )}
          </div>
        )}
      </div>

      {/* 提示词输入 */}
      <div className="space-y-2">
        <label className={`text-sm font-medium ${styles.text.secondary}`}>
          {t('draw.reference.prompt')}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如：'结合这些参考图像的风格，创作一幅夕阳下的城市风景'"
          rows={3}
          className={`w-full ${styles.bg.solid} ${styles.border.primary} border ${styles.text.input} rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60 text-base resize-none`}
          disabled={isGenerating}
        />
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
        disabled={isGenerating || referenceImages.length === 0 || !prompt.trim()}
        className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            {t('draw.results.generating')}
          </span>
        ) : (
          t('draw.reference.generateButton')
        )}
      </button>

      {/* 生成结果显示 */}
      {generatedImageUrl && (
        <div className={`${styles.bg.panel} ${styles.border.primary} border rounded-lg p-4 animate-fade-in`}>
          <div className="text-center space-y-4">
            <img
              src={generatedImageUrl}
              alt="Generated from references"
              className="max-w-full h-auto rounded-lg mx-auto max-h-96 object-contain"
            />
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => onSwitchToEdit(dataURLtoFile(generatedImageUrl, `reference-generated-${Date.now()}.png`))}
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

export default ReferencePanel;