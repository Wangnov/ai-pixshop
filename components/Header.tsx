/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { HiSparkles } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import MiniTab from './MiniTab';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeStyles } from '../utils/themeStyles';

type AppMode = 'edit' | 'draw';

interface HeaderProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ activeMode, onModeChange }) => {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  return (
    <header className={`w-full py-3 md:py-4 px-3 md:px-8 ${styles.border.primary} border-b ${styles.bg.secondary} backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300`}>
      <div className="flex items-center justify-between">
        {/* 左侧：标题 */}
        <div className="flex items-center gap-2 md:gap-3">
          <HiSparkles className="w-5 h-5 md:w-6 md:h-6 text-blue-400 flex-shrink-0" />
          <h1 className={`font-bold tracking-tight ${styles.text.primary} text-sm md:text-xl truncate`}>
            {t('app.title')}
          </h1>
        </div>

        {/* 移动端：居中的 Mini Tab */}
        <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
          <div className={`${styles.bg.panel} ${styles.border.primary} border rounded-lg p-1 flex items-center gap-1`}>
            {[
              { key: 'edit', label: t('modes.edit') },
              { key: 'draw', label: t('modes.draw') }
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => onModeChange(mode.key as AppMode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 min-w-[60px] flex-1 text-center ${activeMode === mode.key
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-sm'
                  : `${styles.text.secondary} hover:bg-white/10`
                  }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* 桌面端：绝对定位居中的 Mini Tab */}
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <MiniTab activeMode={activeMode} onModeChange={onModeChange} />
        </div>

        {/* 右侧：控制按钮 */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;