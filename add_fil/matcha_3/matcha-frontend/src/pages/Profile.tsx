import React, { useState, useEffect } from 'react';
// import Button from '../components/Button.tsx';
import '../styles/Profile.css';
import ProfileCarousel from "../components/Carousel.tsx";
import {useNavigate} from "react-router-dom";

interface UserProfile {
    username: string;
    bio?: string;
    gender?: string;
    sexualPreferences?: string;
    interests?: string[];
}

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const navigate = useNavigate();

    //photos
    const images = [
        '../src/assets/images/profile.png',
        '../src/assets/images/profile.png',
        '../src/assets/images/profile.png',
        '../src/assets/images/profile.png',
        '../src/assets/images/profile.png'
    ];

    useEffect(() => {
        const token = localStorage.getItem('authToken');

        if (!token) {
            navigate('/');
        } else {
            // mockdata for example
            const mockProfile: UserProfile = {
                username: 'JohnDoe',
                bio: 'Passionate about traveling and culinary arts.',
                gender: 'female',
                sexualPreferences: 'straight',
                interests: ['#football', '#travel', '#cooking'],
            };
            setTimeout(() => {
                setProfile(mockProfile);
            }, 500);
        }
    }, [navigate]);

    const handleTagClick = (tag: string) => {
        // Example action when a hashtag is clicked
        console.log(`Hashtag clicked: ${tag}`);
        // You can navigate to a page or filter content based on the clicked hashtag
        // For example, navigate to a tag-specific page or filter the profile posts
    };

    if (!profile) {
        return <p>Loading profile...</p>;
    }

    return (
        <div className="transparent-box">
            <h2 className="profile-detail"><strong>Name:</strong> {profile.username}</h2>
            <ProfileCarousel images={images}/>
            <h2>Gender:</h2>
            {profile.gender && <p className="profile-detail"> {profile.gender}</p>}
            <h2>Sexual Preferences:</h2>
            {profile.sexualPreferences && <p className="profile-detail"> {profile.sexualPreferences}</p>}
            <h2>About me:</h2>
            {profile.bio && <p className="profile-detail"> {profile.bio}</p>}
            {/*hashtags part*/}
            {profile.interests && (
                <div>
                    <h2>Interests:</h2>
                    <p>
                        {profile.interests.map((tag, index) => (
                            <span
                                key={index}
                                className="tag_input"
                                onClick={() => handleTagClick(tag)}
                            >
                                {tag}
                            </span>
                        ))}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Profile;
