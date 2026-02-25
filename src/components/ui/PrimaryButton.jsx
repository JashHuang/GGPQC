import React from 'react';

const PrimaryButton = ({ children, onClick, disabled = false, className = '' }) => {
  return (
    <button
      className={`gm6-btn-primary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
