// frontend/src/pages/chat/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Chat = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);

    const messagesEndRef = useRef(null);
    const messageListRef = useRef(null);

    // Fetch match details and message history
    useEffect(() => {
        const fetchMatchAndMessages = async () => {
            try {
                setLoading(true);

                // Fetch match details
                // Note: This API endpoint doesn't exist yet, we'll implement it later
                const matchResponse = await axios.get(`/api/chat/matches/${matchId}`);
                setMatch(matchResponse.data);

                // Fetch messages
                // Note: This API endpoint doesn't exist yet, we'll implement it later
                const messagesResponse = await axios.get(`/api/chat/messages/${matchId}`);
                setMessages(messagesResponse.data);

            } catch (error) {
                console.error('Error fetching chat data:', error);
                toast.error('Failed to load chat. Please try again.');
                navigate('/matches');
            } finally {
                setLoading(false);
            }
        };

        fetchMatchAndMessages();

        // Setup WebSocket connection for real-time chat
        // This is a placeholder for now - will be implemented later
        const connectWebSocket = () => {
            // In a real implementation, we would:
            // 1. Create a WebSocket connection
            // 2. Listen for messages
            // 3. Update the messages state when a new message arrives

            // Placeholder for WebSocket connection
            console.log('WebSocket would connect here...');

            // Return a cleanup function
            return () => {
                console.log('WebSocket would disconnect here...');
            };
        };

        const cleanup = connectWebSocket();
        return cleanup;
    }, [matchId, navigate]);

    // Scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Format date
    const formatMessageTime = (date) => {
        if (!date) return '';

        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if the message was sent today
        if (messageDate.toDateString() === today.toDateString()) {
            return messageDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Check if the message was sent yesterday
        if (messageDate.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${messageDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        }

        // For older messages, show the date
        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Send a new message
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        try {
            setSendingMessage(true);

            // Send the message
            // Note: This API endpoint doesn't exist yet, we'll implement it later
            const response = await axios.post(`/api/chat/messages/${matchId}`, {
                content: newMessage
            });

            // Add the new message to the list
            setMessages([...messages, response.data]);

            // Clear the input
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setSendingMessage(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Chat Header */}
            <div className="bg-white rounded-t-lg shadow-md p-4 flex justify-between items-center border-b">
                <Link to="/matches" className="text-indigo-600 hover:text-indigo-800 flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Matches
                </Link>

                {match && (
                    <div className="flex items-center">
                        <div className="relative">
                            {match.profilePicture ? (
                                <img
                                    src={`/${match.profilePicture}`}
                                    alt={`${match.firstName} ${match.lastName}`}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-lg font-medium text-gray-500">
                                        {match.firstName?.charAt(0)}{match.lastName?.charAt(0)}
                                    </span>
                                </div>
                            )}

                            {match.isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                            )}
                        </div>

                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                                {match.firstName} {match.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {match.isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>

                        <Link
                            to={`/browse/profile/${match.userId}`}
                            className="ml-4 text-indigo-600 hover:text-indigo-800"
                        >
                            View Profile
                        </Link>
                    </div>
                )}
            </div>

            {/* Chat Messages */}
            <div
                ref={messageListRef}
                className="bg-gray-50 p-4 h-96 overflow-y-auto flex flex-col space-y-4"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={message.id || index}
                            className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                                message.isMine
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none shadow'
                            }`}>
                                <p>{message.content}</p>
                                <p className={`text-xs mt-1 text-right ${
                                    message.isMine ? 'text-indigo-200' : 'text-gray-500'
                                }`}>
                                    {formatMessageTime(message.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white rounded-b-lg shadow-md p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className={`px-4 py-2 rounded-lg text-white font-medium ${
                            !newMessage.trim() || sendingMessage
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                        {sendingMessage ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <span>Send</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;