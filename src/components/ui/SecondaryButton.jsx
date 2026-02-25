import React from 'react';

const SecondaryButton = ({ children, onClick, disabled = false, className = '' }) => {
  return (
    <button
      className={`gm6-btn-secondary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
