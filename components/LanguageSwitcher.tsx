/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiLanguage } from 'react-icons/hi2';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-white/10 rounded-md transition-all duration-200"
      title={t('language.switchLanguage')}
    >
      <HiLanguage className="w-4 h-4" />
      <span className="hidden sm:inline">{t('language.currentLanguage')}</span>
    </button>
  );
};

export default LanguageSwitcher;