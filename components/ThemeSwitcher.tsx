/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HiSun, HiMoon, HiComputerDesktop } from 'react-icons/hi2';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeStyles } from '../utils/themeStyles';
import { useTranslation } from 'react-i18next';

const ThemeSwitcher: React.FC = () => {
  const { theme, actualTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const styles = getThemeStyles(actualTheme);

  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return <HiMoon className="w-4 h-4" />;
      case 'light':
        return <HiSun className="w-4 h-4" />;
      case 'auto':
        return <HiComputerDesktop className="w-4 h-4" />;
      default:
        return <HiMoon className="w-4 h-4" />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'dark':
        return t('theme.darkMode');
      case 'light':
        return t('theme.lightMode');
      case 'auto':
        return t('theme.autoMode');
      default:
        return '';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center p-2 ${styles.text.secondary} ${styles.interactive.hover} ${styles.interactive.hoverText} rounded-md transition-all duration-200`}
      title={getTooltip()}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeSwitcher;