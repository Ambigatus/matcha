import React, { useState, ChangeEvent, FormEvent } from 'react';
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import TextArea from "../components/TextArea";
import TagInput from "../components/TagInput";
import { Tag } from 'react-tag-input';
import PhotoUploadCarousel from "../components/PhotoUploadCarousel.tsx";

interface RegistrationForm {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
    sexualPreferences: string;
    bio: string;
    interests: string[];
}

const Registration: React.FC = () => {
    const [formData, setFormData] = useState<RegistrationForm>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        sexualPreferences: '',
        bio: '',
        interests: [],
    });

    const [errors, setErrors] = useState<Partial<RegistrationForm>>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // const handleInterestsChange = (newInterests: string[]) => {
    //     setFormData(prev => ({ ...prev, interests: newInterests }));
    // };

    const validateForm = (): Partial<RegistrationForm> => {
        const errs: Partial<RegistrationForm> = {};
        if (!formData.username.trim()) errs.username = 'Username is required.';
        if (!formData.email.trim()) {
            errs.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errs.email = 'Email address is invalid.';
        }
        if (!formData.password) {
            errs.password = 'Password is required.';
        } else if (formData.password.length < 6) {
            errs.password = 'Password must be at least 6 characters.';
        }
        if (formData.password !== formData.confirmPassword) {
            errs.confirmPassword = 'Passwords do not match.';
        }
        if (!formData.gender) {
            errs.gender = 'Gender is required.';
        }
        if (!formData.sexualPreferences) {
            errs.sexualPreferences = 'Sexual preferences are required.';
        }
        if (!formData.bio.trim()) {
            errs.bio = 'Bio is required.';
        }
        // if (formData.interests.length === 0) {
        //     errs.interests = 'At least one interest is required.';
        // }
        return errs;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const formErrors = validateForm();
        setErrors(formErrors);
        if (Object.keys(formErrors).length === 0) {
            console.log('Form submitted:', formData);
            setSuccessMessage('Registration successful!');
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                gender: '',
                sexualPreferences: '',
                bio: '',
                interests: [],
            });
        } else {
            setSuccessMessage('');
        }
    };

    const genderOptions = [
        { value: '', label: 'Select Gender' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'non-binary', label: 'Non-Binary' },
        // Add more options as needed
    ];

    const sexualPreferencesOptions = [
        { value: '', label: 'Select Sexual Preferences' },
        { value: 'heterosexual', label: 'Heterosexual' },
        { value: 'homosexual', label: 'Homosexual' },
        { value: 'bisexual', label: 'Bisexual' },
    ];

    return (
        <div className="transparent-box">
            <h2>Registration</h2>
            <PhotoUploadCarousel />
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username</label>
                    <Input type="text" id="username" name="username" value={formData.username} onChange={handleChange} />
                    {errors.username && <span>{errors.username}</span>}
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                    {errors.email && <span>{errors.email}</span>}
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <Input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
                    {errors.password && <span>{errors.password}</span>}
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <Input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
                    {errors.confirmPassword && <span>{errors.confirmPassword}</span>}
                </div>
                <div>
                    {/*<label htmlFor="gender">Gender</label>*/}
                    <Select id="gender" label="gender" name="gender" value={formData.gender} onChange={handleChange} options={genderOptions} />
                    {errors.gender && <span>{errors.gender}</span>}
                </div>
                <div>
                    <Select label="sexualPreferences" id="sexualPreferences" name="sexualPreferences" value={formData.sexualPreferences} onChange={handleChange} options={sexualPreferencesOptions} />
                    {errors.sexualPreferences && <span>{errors.sexualPreferences}</span>}
                </div>
                <div>
                    <TextArea label="Bio" id="bio" name="bio" value={formData.bio} onChange={handleChange} />
                    {errors.bio && <span>{errors.bio}</span>}
                </div>
                <div>
                    <label htmlFor="interests">Interests</label>
                    <TagInput id="interests" selectedTags={tags} setSelectedTags={setTags} />
                    {errors.interests && <span>{errors.interests}</span>}
                </div>
                <Button type="submit">Register</Button>
                {successMessage && <p>{successMessage}</p>}
            </form>
        </div>
    );
};

export default Registration;
