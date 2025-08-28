/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Theme } from '../contexts/ThemeContext';

// 主题样式映射工具
export const getThemeStyles = (theme: Theme) => {
  const styles = {
    // 背景层级系统
    bg: {
      primary: theme === 'dark' ? '' : 'bg-slate-50',
      secondary: theme === 'dark' ? 'bg-gray-800/30' : 'bg-white/70',
      tertiary: theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50', 
      card: theme === 'dark' ? 'bg-black/20' : 'bg-gray-50',
      solid: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      panel: theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/90',
    },
    
    // 边框系统
    border: {
      primary: theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
      secondary: theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200',
      translucent: theme === 'dark' ? 'border-white/20' : 'border-gray-300',
      focus: 'border-blue-500', // 保持一致
    },
    
    // 文字层级
    text: {
      primary: theme === 'dark' ? 'text-gray-100' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-700', 
      tertiary: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
      placeholder: theme === 'dark' ? 'text-gray-500' : 'text-gray-500',
      input: theme === 'dark' ? 'text-gray-200' : 'text-gray-800',
    },
    
    // 交互状态
    interactive: {
      default: theme === 'dark' ? 'bg-white/10' : 'bg-gray-100',
      hover: theme === 'dark' ? 'hover:bg-white/20' : 'hover:bg-gray-200',
      hoverBorder: theme === 'dark' ? 'hover:border-white/30' : 'hover:border-gray-400',
      hoverText: theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900',
      pressed: 'active:scale-95', // 保持一致
    },
    
    // 阴影系统
    shadow: {
      primary: theme === 'dark' ? 'shadow-2xl' : 'shadow-lg',
      blue: theme === 'dark' ? 'shadow-blue-500/20' : 'shadow-blue-500/30',
      blueHover: theme === 'dark' ? 'hover:shadow-blue-500/40' : 'hover:shadow-blue-500/50',
    },
    
    // 强调色（保持一致）
    accent: {
      blue: 'bg-blue-500',
      blueGradient: 'bg-gradient-to-br from-blue-600 to-blue-500',
      green: 'bg-green-500',
      greenGradient: 'bg-gradient-to-br from-green-600 to-green-500',
      red: 'bg-red-500',
    }
  };

  return styles;
};

// 获取主题相关的类名组合
export const getThemeClass = (theme: Theme, styleKey: string, fallback: string = '') => {
  const styles = getThemeStyles(theme);
  
  // 支持点记法访问嵌套属性 如 'bg.primary', 'text.secondary'
  const keys = styleKey.split('.');
  let value: any = styles;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }
  
  return value || fallback;
};