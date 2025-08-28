/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeStyles } from '../utils/themeStyles';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
}

type AspectRatio = 'free' | 'square' | 'widescreen';

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, onSetAspect, isLoading, isCropping }) => {
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('free');
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);
  
  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  }

  const aspects: { key: AspectRatio, value: number | undefined }[] = [
    { key: 'free', value: undefined },
    { key: 'square', value: 1 / 1 },
    { key: 'widescreen', value: 16 / 9 },
  ];

  return (
    <div className={`w-full ${styles.bg.tertiary} ${styles.border.primary} border rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm transition-colors duration-300`}>
      <h3 className={`text-lg font-semibold ${styles.text.secondary}`}>{t('crop.title')}</h3>
      <p className={`text-sm ${styles.text.tertiary} -mt-2`}>{t('crop.instruction')}</p>
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${styles.text.tertiary}`}>{t('crop.aspectRatio')}</span>
        {aspects.map(({ key, value }) => (
          <button
            key={key}
            onClick={() => handleAspectChange(key, value)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 ${styles.interactive.pressed} disabled:opacity-50 ${
              activeAspect === key 
              ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
              : `${styles.interactive.default} ${styles.interactive.hover} ${styles.text.input}`
            }`}
          >
            {t(`crop.ratios.${key}`)}
          </button>
        ))}
      </div>

      <button
        onClick={onApplyCrop}
        disabled={isLoading || !isCropping}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
      >
        {t('crop.applyButton')}
      </button>
    </div>
  );
};

export default CropPanel;