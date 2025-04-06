import React from 'react';
import '../styles/CommonImage.css';

interface ImageProps {
    src: string;
    alt: string;
    className?: string;
}

const Image: React.FC<ImageProps> = ({ src, alt, className }) => {
    return <img src={src} alt={alt} className={`custom-image ${className}`} />;
};

export default Image;
