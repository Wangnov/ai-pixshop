/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeStyles } from '../../utils/themeStyles';
import { analyzeImage } from '../../services/geminiDrawService';
import Spinner from '../Spinner';

interface AnalysisPanelProps {
  onPromptGenerated: (prompt: string) => void;
}

interface AnalysisResult {
  composition: string;
  colors: string;
  suggestions: string;
  improvementPrompts: string[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ onPromptGenerated }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type.startsWith('image/')) {
      setSelectedImage(file);
      setError(null);
      setAnalysisResult(null);
    } else {
      setError(t('draw.errors.unsupportedFormat'));
    }
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError(t('draw.errors.noImageToAnalyze'));
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeImage(selectedImage);
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(t('draw.errors.analysisFailed', { error: errorMessage }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUsePrompt = (prompt: string) => {
    onPromptGenerated(prompt);
  };

  return (
    <div className={`w-full ${styles.bg.tertiary} ${styles.border.primary} border rounded-lg p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-sm transition-colors duration-300`}>
      <h3 className={`text-xl font-semibold text-center ${styles.text.primary}`}>
        {t('draw.analysis.title')}
      </h3>

      {/* 图像上传区域 */}
      <div 
        className={`border-2 border-dashed ${selectedImage ? styles.border.primary : 'border-gray-400'} rounded-lg p-6 text-center transition-colors duration-200 hover:border-blue-400`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {!selectedImage ? (
          <div className="space-y-4">
            <div className="text-4xl">🔍</div>
            <div>
              <p className={`text-lg font-medium ${styles.text.primary}`}>
                {t('draw.analysis.uploadForAnalysis')}
              </p>
              <p className={`text-sm ${styles.text.tertiary} mt-1`}>
                上传图像进行构图、色彩和改进分析
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40"
              disabled={isAnalyzing}
            >
              {t('draw.analysis.uploadForAnalysis')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="To analyze"
              className="max-w-full h-auto rounded-lg mx-auto max-h-64 object-contain"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`${styles.interactive.default} ${styles.border.primary} border ${styles.text.input} font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm`}
                disabled={isAnalyzing}
              >
                {t('actions.uploadNew')}
              </button>
              <button
                onClick={handleAnalyze}
                className="bg-gradient-to-br from-purple-600 to-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 text-sm"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    {t('draw.results.analyzing')}
                  </span>
                ) : (
                  t('draw.analysis.analyzeButton')
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg animate-fade-in">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 分析结果显示 */}
      {analysisResult && (
        <div className={`${styles.bg.panel} ${styles.border.primary} border rounded-lg p-6 animate-fade-in space-y-6`}>
          <h4 className={`text-lg font-semibold ${styles.text.primary} text-center`}>
            {t('draw.results.generated')}
          </h4>

          {/* 构图分析 */}
          <div className="space-y-2">
            <h5 className={`font-medium ${styles.text.secondary}`}>
              {t('draw.analysis.composition')}
            </h5>
            <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>
              {analysisResult.composition}
            </p>
          </div>

          {/* 色彩分析 */}
          <div className="space-y-2">
            <h5 className={`font-medium ${styles.text.secondary}`}>
              {t('draw.analysis.colors')}
            </h5>
            <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>
              {analysisResult.colors}
            </p>
          </div>

          {/* 改进建议 */}
          <div className="space-y-2">
            <h5 className={`font-medium ${styles.text.secondary}`}>
              {t('draw.analysis.suggestions')}
            </h5>
            <p className={`text-sm ${styles.text.tertiary} leading-relaxed`}>
              {analysisResult.suggestions}
            </p>
          </div>

          {/* 改进提示词 */}
          {analysisResult.improvementPrompts && analysisResult.improvementPrompts.length > 0 && (
            <div className="space-y-3">
              <h5 className={`font-medium ${styles.text.secondary}`}>
                {t('draw.analysis.suggestions')}
              </h5>
              <div className="grid gap-2">
                {analysisResult.improvementPrompts.map((prompt, index) => (
                  <div key={index} className={`${styles.bg.solid} ${styles.border.primary} border rounded-lg p-3 flex justify-between items-center`}>
                    <span className={`text-sm ${styles.text.tertiary} flex-1`}>
                      {prompt}
                    </span>
                    <button
                      onClick={() => handleUsePrompt(prompt)}
                      className="ml-3 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-1 px-3 rounded text-xs transition-all duration-300"
                    >
                      {t('draw.analysis.usePrompt')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;