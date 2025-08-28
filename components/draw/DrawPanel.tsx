/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeStyles } from '../../utils/themeStyles';
import TextToImagePanel from './TextToImagePanel';
import ReferencePanel from './ReferencePanel';
import AnalysisPanel from './AnalysisPanel';

type DrawMode = 'textToImage' | 'reference' | 'analysis';

interface DrawPanelProps {
  onImageGenerated?: (imageFile: File) => void;
  onSwitchToEdit?: (imageFile: File) => void;
  referenceImage?: File | null;
}

const DrawPanel: React.FC<DrawPanelProps> = ({ 
  onImageGenerated, 
  onSwitchToEdit, 
  referenceImage 
}) => {
  const [activeMode, setActiveMode] = useState<DrawMode>('textToImage');
  const [generatedImages, setGeneratedImages] = useState<File[]>([]);
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  const handleImageGenerated = (imageFile: File) => {
    setGeneratedImages(prev => [...prev, imageFile]);
    onImageGenerated?.(imageFile);
  };

  const handleUseAsReference = (imageFile: File) => {
    setActiveMode('reference');
    // 这里会传递给 ReferencePanel 作为参考图像
  };

  const modes = [
    { key: 'textToImage' as const, label: t('draw.modes.textToImage') },
    { key: 'reference' as const, label: t('draw.modes.reference') },
    { key: 'analysis' as const, label: t('draw.modes.analysis') }
  ];

  const renderActivePanel = () => {
    switch (activeMode) {
      case 'textToImage':
        return (
          <TextToImagePanel
            onImageGenerated={handleImageGenerated}
            onUseAsReference={handleUseAsReference}
            onSwitchToEdit={onSwitchToEdit}
          />
        );
      case 'reference':
        return (
          <ReferencePanel
            onImageGenerated={handleImageGenerated}
            onSwitchToEdit={onSwitchToEdit}
            initialReferenceImage={referenceImage}
          />
        );
      case 'analysis':
        return (
          <AnalysisPanel
            onPromptGenerated={(prompt) => {
              setActiveMode('textToImage');
              // 将生成的提示词传递给TextToImagePanel
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
      {/* Draw 模式标题 */}
      <div className={`w-full ${styles.bg.card} ${styles.border.primary} border rounded-lg p-6 text-center transition-colors duration-300`}>
        <h2 className={`text-2xl font-bold mb-2 ${styles.text.primary}`}>
          {t('draw.title')}
        </h2>
        <p className={`${styles.text.secondary}`}>
          {t('draw.subtitle')}
        </p>
      </div>

      {/* 模式切换标签 */}
      <div className={`w-full ${styles.bg.panel} ${styles.border.primary} border rounded-lg p-2 flex items-center justify-center gap-2 backdrop-blur-sm transition-colors duration-300`}>
        {modes.map(mode => (
          <button
            key={mode.key}
            onClick={() => setActiveMode(mode.key)}
            className={`flex-1 min-w-0 font-semibold py-3 px-4 rounded-md transition-all duration-200 text-base ${
              activeMode === mode.key 
              ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/40' 
              : `${styles.text.secondary} ${styles.interactive.hoverText} ${styles.interactive.hover}`
            }`}
          >
            <span className="truncate">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* 活动面板 */}
      <div className="w-full">
        {renderActivePanel()}
      </div>
    </div>
  );
};

export default DrawPanel;