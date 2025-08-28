/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const FloatingLights: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* 大型光斑 */}
      <div 
        className="floating-light" 
        style={{ 
          width: '120px', 
          height: '120px', 
          top: '15%', 
          left: '10%',
          animationDelay: '0s',
          animationDuration: '15s'
        }} 
      />
      
      {/* 中型光斑 */}
      <div 
        className="floating-light" 
        style={{ 
          width: '80px', 
          height: '80px', 
          top: '60%', 
          right: '15%',
          animationDelay: '3s',
          animationDuration: '12s'
        }} 
      />
      
      {/* 小型光斑 */}
      <div 
        className="floating-light" 
        style={{ 
          width: '60px', 
          height: '60px', 
          bottom: '25%', 
          left: '20%',
          animationDelay: '6s',
          animationDuration: '10s'
        }} 
      />
      
      {/* 微型光点 */}
      <div 
        className="floating-light" 
        style={{ 
          width: '40px', 
          height: '40px', 
          top: '40%', 
          left: '70%',
          animationDelay: '2s',
          animationDuration: '14s'
        }} 
      />
      
      <div 
        className="floating-light" 
        style={{ 
          width: '50px', 
          height: '50px', 
          bottom: '40%', 
          right: '25%',
          animationDelay: '8s',
          animationDuration: '11s'
        }} 
      />
      
      {/* 细微装饰光点 */}
      <div 
        className="floating-light" 
        style={{ 
          width: '30px', 
          height: '30px', 
          top: '80%', 
          left: '60%',
          animationDelay: '5s',
          animationDuration: '13s'
        }} 
      />
    </div>
  );
};

export default FloatingLights;