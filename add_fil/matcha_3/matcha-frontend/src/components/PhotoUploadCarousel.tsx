import React, { useState } from "react";
import "../styles/PhotoUploadCarousel.css";
import CommonImage from "../components/CommonImage.tsx";

const PhotoUploadCarousel: React.FC = () => {
    const [photos, setPhotos] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const uploadedPhotos = Array.from(event.target.files).map((file) =>
                URL.createObjectURL(file)
            );
            setPhotos([...photos, ...uploadedPhotos]);
            if (photos.length === 0) setCurrentIndex(0);
        }
    };

    const nextPhoto = () => {
        if (photos.length > 0) {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
        }
    };

    const prevPhoto = () => {
        if (photos.length > 0) {
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? photos.length - 1 : prevIndex - 1
            );
        }
    };

    return (
        <div className="photo-upload-carousel">
            <div className="carousel-container">
                {photos.length > 0 ? (
                    <CommonImage src={photos[currentIndex]} alt="Uploaded Preview" className="carousel-photo"/>
                ) : (
                    <p>No photos uploaded</p>
                )}
            </div>
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload}/>
            <div className="carousel-buttons">
                <button onClick={prevPhoto} disabled={photos.length <= 1}>
                    &#10094;
                </button>
                <button onClick={nextPhoto} disabled={photos.length <= 1}>
                    &#10095;
                </button>
            </div>
        </div>
    );
};

export default PhotoUploadCarousel;
