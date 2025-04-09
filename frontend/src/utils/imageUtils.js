// frontend/src/utils/imageUtils.js

// Get API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Get full image URL from relative path
 * @param {string} path - Relative image path from server
 * @returns {string} - Full image URL
 */
export const getImageUrl = (path) => {
    if (!path) return null;

    // If the path already includes the base URL, return as is
    if (path.startsWith('http')) {
        return path;
    }

    // If the path starts with a slash, remove it to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Get initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} - Initials (up to 2 characters)
 */
export const getInitials = (firstName, lastName) => {
    const firstInitial = firstName && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName && lastName.length > 0 ? lastName.charAt(0).toUpperCase() : '';

    return `${firstInitial}${lastInitial}`;
};

/**
 * Generate a fallback avatar component
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} - Avatar component with initials
 */
export const FallbackAvatar = ({ firstName, lastName, className = '' }) => {
    const initials = getInitials(firstName, lastName);

    return (
        <div className={`bg-gray-200 flex items-center justify-center text-gray-500 ${className}`}>
            <span className="font-medium">{initials}</span>
        </div>
    );
};