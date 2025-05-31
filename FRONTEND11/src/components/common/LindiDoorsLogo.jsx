import React from 'react';
import PropTypes from 'prop-types';

const LindiDoorsLogo = ({ 
  size = 40, 
  showText = true, 
  textSize = 'medium',
  className = '',
  onClick = null,
  style = {}
}) => {
  const getTextStyles = () => {
    switch (textSize) {
      case 'small':
        return {
          brandName: { fontSize: '1rem', fontWeight: 700 },
          brandSubtitle: { fontSize: '0.7rem', fontWeight: 500 }
        };
      case 'large':
        return {
          brandName: { fontSize: '1.6rem', fontWeight: 800 },
          brandSubtitle: { fontSize: '1rem', fontWeight: 600 }
        };
      default: // medium
        return {
          brandName: { fontSize: '1.3rem', fontWeight: 700 },
          brandSubtitle: { fontSize: '0.85rem', fontWeight: 500 }
        };
    }
  };

  const textStyles = getTextStyles();
  const gradientId = `logoGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div 
      className={`lindi-logo ${className}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: showText ? '12px' : '0',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {/* Logo Icon */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '6px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFC107" />
              <stop offset="50%" stopColor="#FF9800" />
              <stop offset="100%" stopColor="#F44336" />
            </linearGradient>
          </defs>
          
          {/* Main L shape */}
          <path 
            d="M20 15 L20 70 L75 70 L75 85 L5 85 L5 15 Z" 
            fill={`url(#${gradientId})`}
          />
          
          {/* Top accent piece */}
          <path 
            d="M50 15 L95 15 L95 45 L75 45 L75 30 L50 30 Z" 
            fill={`url(#${gradientId})`}
            opacity="0.9"
          />
          
          {/* Right accent piece */}
          <path 
            d="M75 45 L95 45 L95 70 L75 70 Z" 
            fill={`url(#${gradientId})`}
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1
          }}
        >
          <div 
            style={{
              ...textStyles.brandName,
              color: '#212529',
              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.5)',
              letterSpacing: '0.5px'
            }}
          >
            LINDI
          </div>
          <div 
            style={{
              ...textStyles.brandSubtitle,
              color: '#495057',
              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
              letterSpacing: '1px',
              marginTop: '-2px'
            }}
          >
            DOORS
          </div>
        </div>
      )}
    </div>
  );
};

LindiDoorsLogo.propTypes = {
  size: PropTypes.number,
  showText: PropTypes.bool,
  textSize: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object
};

export default LindiDoorsLogo; 