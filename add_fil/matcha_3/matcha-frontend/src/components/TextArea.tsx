import React from 'react';
import '../styles/TextArea.css';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
    return (
        <div className="textarea-group">
            <label className="textarea-group__label">{label}</label>
            <textarea className={`textarea-group__textarea ${className}`} {...props} />
        </div>
    );
};

export default TextArea;
