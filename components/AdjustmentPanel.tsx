/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeStyles } from '../utils/themeStyles';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  const presets = [
    { name: t('adjustments.presets.blur'), prompt: '应用逼真的景深效果，使背景模糊，同时保持主体清晰对焦。' },
    { name: t('adjustments.presets.enhance'), prompt: '轻微增强图像的清晰度和细节，使其看起来自然。' },
    { name: t('adjustments.presets.warmLight'), prompt: '调整色温，为图像增添温暖的黄金时刻风格光照。' },
    { name: t('adjustments.presets.studioLight'), prompt: '为主体添加引人注目的专业影棚光。' },
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyAdjustment(activePrompt);
    }
  };

  return (
    <div className={`w-full ${styles.bg.tertiary} ${styles.border.primary} border rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm transition-colors duration-300`}>
      <h3 className={`text-lg font-semibold text-center ${styles.text.secondary}`}>{t('adjustments.title')}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center ${styles.interactive.default} border border-transparent ${styles.text.input} font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out ${styles.interactive.hover} hover:border-opacity-20 ${styles.interactive.pressed} text-base disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? `ring-2 ring-offset-2 ${actualTheme === 'dark' ? 'ring-offset-gray-800' : 'ring-offset-white'} ring-blue-500` : ''}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder={t('adjustments.customPlaceholder')}
        className={`flex-grow ${styles.bg.solid} ${styles.border.primary} border ${styles.text.input} rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base`}
        disabled={isLoading}
      />

      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
            <button
                onClick={handleApply}
                className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
                disabled={isLoading || !activePrompt.trim()}
            >
                {t('adjustments.applyButton')}
            </button>
        </div>
      )}
    </div>
  );
};

export default AdjustmentPanel;