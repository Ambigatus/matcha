import React from 'react';
import '../styles/Select.css';

interface Option {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: Option[];
}

const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
    return (
        <div className="select-group">
            <label className="select-group__label">{label}</label>
            <select className={`select-group__select ${className}`} {...props}>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Select;
