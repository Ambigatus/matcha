// frontend/src/pages/chat/Chat.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import AuthContext from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils'; // Assuming we have this utility

// Get API URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Chat = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useContext(AuthContext);

    const [match, setMatch] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showTypingIndicator, setShowTypingIndicator] = useState(false);

    const messagesEndRef = useRef(null);
    const messageListRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Setup WebSocket connection and fetch messages
    useEffect(() => {
        // Create socket connection
        const connectWebSocket = () => {
            socketRef.current = io(API_BASE_URL, {
                auth: { token }
            });

            // Socket event listeners
            socketRef.current.on('connect', () => {
                console.log('Socket connected');
            });

            socketRef.current.on('error', (error) => {
                console.error('Socket error:', error);
                toast.error('Connection error. Please try refreshing the page.');
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            // Listen for new messages
            socketRef.current.on('new_message', (message) => {
                if (message.match_id === parseInt(matchId)) {
                    setMessages(prevMessages => [...prevMessages, {
                        ...message,
                        isMine: false
                    }]);

                    // Mark message as read
                    socketRef.current.emit('mark_message_read', {
                        messageId: message.message_id
                    });
                }
            });

            // Listen for typing indicators
            socketRef.current.on('typing_indicator', (data) => {
                if (data.matchId === parseInt(matchId)) {
                    setShowTypingIndicator(data.isTyping);
                }
            });

            // Listen for message read status updates
            socketRef.current.on('message_read', ({ messageId }) => {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.message_id === messageId ? { ...msg, is_read: true } : msg
                    )
                );
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        };

        const cleanup = connectWebSocket();
        fetchMatchAndMessages();

        return () => {
            cleanup();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [matchId, token, navigate]);

    // Fetch match details and message history
    const fetchMatchAndMessages = async () => {
        try {
            setLoading(true);

            // Fetch match details
            const matchResponse = await axios.get(`/api/chat/conversations`);
            const matchData = matchResponse.data.find(m => m.match_id.toString() === matchId);

            if (!matchData) {
                toast.error('Match not found');
                navigate('/matches');
                return;
            }

            setMatch(matchData);

            // Fetch messages
            const messagesResponse = await axios.get(`/api/chat/messages/${matchId}`);

            // Add isMine flag to each message
            const formattedMessages = messagesResponse.data.map(message => ({
                ...message,
                isMine: message.sender_id === user.id
            }));

            setMessages(formattedMessages);

        } catch (error) {
            console.error('Error fetching chat data:', error);
            toast.error('Failed to load chat. Please try again.');
            navigate('/matches');
        } finally {
            setLoading(false);
        }
    };

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

    // Handle typing indicator
    const handleTyping = () => {
        if (!isTyping && socketRef.current) {
            setIsTyping(true);
            socketRef.current.emit('typing', {
                matchId: parseInt(matchId),
                receiverId: match.other_user_id
            });
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping && socketRef.current) {
                setIsTyping(false);
                socketRef.current.emit('stop_typing', {
                    matchId: parseInt(matchId),
                    receiverId: match.other_user_id
                });
            }
        }, 3000);
    };

    // Send a new message
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        try {
            setSendingMessage(true);

            // Clear typing indicator
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            if (isTyping && socketRef.current) {
                setIsTyping(false);
                socketRef.current.emit('stop_typing', {
                    matchId: parseInt(matchId),
                    receiverId: match.other_user_id
                });
            }

            // Either use socket to send message or HTTP request
            // Using socket for real-time delivery
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('send_message', {
                    matchId: parseInt(matchId),
                    receiverId: match.other_user_id,
                    content: newMessage
                });

                // Optimistically add message to UI (will be confirmed by server)
                const optimisticMessage = {
                    message_id: `temp-${Date.now()}`,
                    match_id: parseInt(matchId),
                    sender_id: user.id,
                    receiver_id: match.other_user_id,
                    content: newMessage,
                    is_read: false,
                    created_at: new Date().toISOString(),
                    isMine: true,
                    pending: true
                };

                setMessages(prev => [...prev, optimisticMessage]);
            } else {
                // Fallback to HTTP if socket isn't connected
                const response = await axios.post(`/api/chat/messages/${matchId}`, {
                    content: newMessage
                });

                // Add the confirmed message to the list
                setMessages(prev => [...prev, {
                    ...response.data,
                    isMine: true
                }]);
            }

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

    if (!match) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 mb-4">This conversation doesn't exist or was deleted.</p>
                <Link to="/matches" className="text-indigo-600 hover:text-indigo-800">
                    Return to matches
                </Link>
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

                <div className="flex items-center">
                    <div className="relative">
                        {match.profile_picture ? (
                            <img
                                src={getImageUrl(match.profile_picture)}
                                alt={`${match.first_name} ${match.last_name}`}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-lg font-medium text-gray-500">
                                    {match.first_name?.charAt(0)}{match.last_name?.charAt(0)}
                                </span>
                            </div>
                        )}

                        {match.is_online && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                        )}
                    </div>

                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                            {match.first_name} {match.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {match.is_online ? 'Online' : 'Offline'}
                        </p>
                    </div>

                    <Link
                        to={`/browse/profile/${match.other_user_id}`}
                        className="ml-4 text-indigo-600 hover:text-indigo-800"
                    >
                        View Profile
                    </Link>
                </div>
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
                            key={message.message_id || index}
                            className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                                message.isMine
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none shadow'
                            } ${message.pending ? 'opacity-70' : ''}`}>
                                <p>{message.content}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className={`text-xs ${
                                        message.isMine ? 'text-indigo-200' : 'text-gray-500'
                                    }`}>
                                        {formatMessageTime(message.created_at)}
                                    </span>

                                    {message.isMine && (
                                        <span className="ml-2">
                                            {message.pending ? (
                                                <svg className="h-3 w-3 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : message.is_read ? (
                                                <svg className="h-3 w-3 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="h-3 w-3 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12z" />
                                                </svg>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {showTypingIndicator && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg rounded-bl-none">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    </div>
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
                        onKeyDown={() => handleTyping()}
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