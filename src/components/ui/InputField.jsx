import React from 'react';

const InputField = ({ 
  label, 
  value, 
  onChange, 
  placeholder = '', 
  type = 'text',
  className = '' 
}) => {
  return (
    <div className={`gm6-input-field ${className}`}>
      {label && <label className="gm6-input-label">{label}</label>}
      <input
        type={type}
        className="gm6-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default InputField;
