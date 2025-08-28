/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SunIcon } from './icons';
import { useTranslation, Trans } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeStyles } from '../utils/themeStyles';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-blue-500/10 border-dashed border-blue-400' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className={`text-5xl font-extrabold tracking-tight ${styles.text.primary} sm:text-6xl md:text-7xl`}>
          <Trans 
            i18nKey="startScreen.title"
            components={[
              <span className="text-blue-400" key="highlight" />
            ]}
          />
        </h1>
        <p className={`max-w-2xl text-lg ${styles.text.tertiary} md:text-xl`}>
          {t('startScreen.subtitle')}
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-blue-600 rounded-full cursor-pointer group hover:bg-blue-500 transition-colors">
                <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                {t('startScreen.uploadButton')}
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className={`text-sm ${styles.text.placeholder}`}>{t('startScreen.dragAndDrop')}</p>
        </div>

        <div className="mt-16 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className={`${styles.bg.card} p-6 rounded-lg ${styles.border.secondary} border flex flex-col items-center text-center transition-colors duration-300`}>
                    <div className={`flex items-center justify-center w-12 h-12 ${actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full mb-4 transition-colors duration-300`}>
                       <MagicWandIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className={`text-xl font-bold ${styles.text.primary}`}>{t('startScreen.features.retouch.title')}</h3>
                    <p className={`mt-2 ${styles.text.tertiary}`}>{t('startScreen.features.retouch.description')}</p>
                </div>
                <div className={`${styles.bg.card} p-6 rounded-lg ${styles.border.secondary} border flex flex-col items-center text-center transition-colors duration-300`}>
                    <div className={`flex items-center justify-center w-12 h-12 ${actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full mb-4 transition-colors duration-300`}>
                       <PaletteIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className={`text-xl font-bold ${styles.text.primary}`}>{t('startScreen.features.filters.title')}</h3>
                    <p className={`mt-2 ${styles.text.tertiary}`}>{t('startScreen.features.filters.description')}</p>
                </div>
                <div className={`${styles.bg.card} p-6 rounded-lg ${styles.border.secondary} border flex flex-col items-center text-center transition-colors duration-300`}>
                    <div className={`flex items-center justify-center w-12 h-12 ${actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full mb-4 transition-colors duration-300`}>
                       <SunIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className={`text-xl font-bold ${styles.text.primary}`}>{t('startScreen.features.adjustments.title')}</h3>
                    <p className={`mt-2 ${styles.text.tertiary}`}>{t('startScreen.features.adjustments.description')}</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;