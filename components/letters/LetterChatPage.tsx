import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Chat } from '@google/genai';
import { getLetterById, getChatHistory, addChatMessage } from '../../services/mockApi';
import { startChat, sendChatMessage } from '../../services/geminiService';
import { Letter, ChatMessage } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';

const LetterChatPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useI18n();
    const [letter, setLetter] = useState<Letter | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            try {
                const letterData = await getLetterById(id);
                const chatHistory = await getChatHistory(id);
                setLetter(letterData);
                setMessages(chatHistory);
                chatRef.current = startChat(letterData, chatHistory); // Initialize Gemini chat and store in ref
            } catch (err) {
                setError('Failed to load chat data.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);


    const handleSend = async () => {
        if (!input.trim() || !id) return;

        const userMessage = await addChatMessage(id, input);
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsTyping(true);

        try {
            const aiResponseText = await sendChatMessage(chatRef.current, currentInput);
            const aiMessage = await addChatMessage(id, aiResponseText, 'assistant');
            setMessages(prev => [...prev, aiMessage]);
        } catch (err: any) {
            console.error("Chat send error:", err);
            const errorMessage = await addChatMessage(id, `Sorry, I encountered an error: ${err.message}`, 'assistant');
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };
    
    if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    if (error || !letter) return <div className="text-center text-red-500">{error || 'Letter not found.'}</div>;
    
    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-2xl shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
                 <Link to={`/letter/${id}`} className="text-sm text-primary hover:underline">&larr; Back to Letter Details</Link>
                <h1 className="text-xl font-bold text-slate-800 text-center">{t('chat.title')}</h1>
            </div>

            {/* Suggestion Banner */}
            <div className="p-3 bg-secondary-light border-b border-secondary-dark/20 text-sm text-slate-700 flex-shrink-0">
                <span className="font-bold">{t('detail.suggestionBanner')}: </span>{letter.ai_suggestion}
            </div>

            {/* Chat History */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="px-4 py-2 rounded-2xl bg-slate-100 rounded-bl-none">
                           <Spinner size="sm" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={t('chat.inputPlaceholder')}
                        className="flex-grow p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary bg-white text-slate-900"
                        disabled={isTyping}
                    />
                    <Button onClick={handleSend} disabled={isTyping || !input.trim()}>Send</Button>
                </div>
            </div>
        </div>
    );
};

export default LetterChatPage;