import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`gm6-card ${className}`}>
      {children}
    </div>
  );
};

export default Card;
