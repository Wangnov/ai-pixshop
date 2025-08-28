/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiLanguage } from 'react-icons/hi2';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeStyles } from '../utils/themeStyles';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 text-sm ${styles.text.secondary} ${styles.interactive.hover} ${styles.interactive.hoverText} rounded-md transition-all duration-200`}
      title={t('language.switchLanguage')}
    >
      <HiLanguage className="w-4 h-4" />
      <span className="hidden sm:inline">{t('language.currentLanguage')}</span>
    </button>
  );
};

export default LanguageSwitcher;