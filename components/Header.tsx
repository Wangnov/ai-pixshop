/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { HiSparkles } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeStyles } from '../utils/themeStyles';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  return (
    <header className={`w-full py-4 px-8 ${styles.border.primary} border-b ${styles.bg.secondary} backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HiSparkles className="w-6 h-6 text-blue-400" />
          <h1 className={`text-xl font-bold tracking-tight ${styles.text.primary}`}>
            {t('app.title')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;