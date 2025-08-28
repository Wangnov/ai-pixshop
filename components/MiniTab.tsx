/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeStyles } from '../utils/themeStyles';

type AppMode = 'edit' | 'draw';

interface MiniTabProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const MiniTab: React.FC<MiniTabProps> = ({ activeMode, onModeChange }) => {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const styles = getThemeStyles(actualTheme);

  const modes: { key: AppMode; label: string }[] = [
    { key: 'edit', label: t('modes.edit') },
    { key: 'draw', label: t('modes.draw') }
  ];

  return (
    <div className={`${styles.bg.panel} ${styles.border.primary} border rounded-lg p-1 flex items-center gap-1 backdrop-blur-sm transition-colors duration-300`}>
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => onModeChange(mode.key)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 min-w-[60px] flex-1 text-center ${
            activeMode === mode.key
              ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-sm'
              : `${styles.text.secondary} ${styles.interactive.hoverText} hover:bg-white/10`
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};

export default MiniTab;