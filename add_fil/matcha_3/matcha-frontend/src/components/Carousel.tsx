import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../styles/Carousel.css';
import CommonImage from "../components/CommonImage.tsx";

interface ProfileCarouselProps {
    images: string[];
}

const ProfileCarousel: React.FC<ProfileCarouselProps> = ({ images }) => {
    return (
        <Carousel
            showArrows={true}
            showThumbs={false}
            infiniteLoop={true}
            autoPlay={true}
            interval={3000}
            transitionTime={500}
        >
            {images.map((src, index) => (
                <div key={index}>
                    <CommonImage src={src} alt={`Profile image ${index + 1}`} />
                </div>
            ))}
        </Carousel>
    );
};

export default ProfileCarousel;
