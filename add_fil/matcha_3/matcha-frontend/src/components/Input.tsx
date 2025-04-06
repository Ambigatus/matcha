import React, { InputHTMLAttributes } from 'react';
import '../styles/Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
    return <input className={`custom-input ${className}`} {...props} />;
};

export default Input;
