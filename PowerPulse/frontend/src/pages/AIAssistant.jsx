import { useState, useRef, useEffect, useContext } from 'react';
import { Bot, Send, User, Sparkles, Loader2, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';
import { MetricsContext } from '../App';

const SUGGESTED_QUESTIONS = [
    "What is CPU scheduling?",
    "How does virtual memory work?",
    "Explain my current system health",
    "What are the features of PowerPulse?",
    "How can I reduce power consumption?",
    "What is the difference between paging and segmentation?",
    "Explain process states and transitions",
    "What is thrashing in OS?",
];

/* ── tiny markdown renderer ── */
function renderMarkdown(text) {
    if (!text) return '';
    let html = text
        // code blocks ```...```
        .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="ai-code-block"><code>$2</code></pre>')
        // inline code
        .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
        // bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // unordered lists
        .replace(/^[•\-\*]\s+(.+)$/gm, '<li>$1</li>')
        // ordered lists
        .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
        // wrap consecutive <li> into <ul>
        .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="ai-list">$1</ul>')
        // line breaks (but not inside pre)
        .replace(/\n/g, '<br/>');
    return html;
}

function AIAssistant() {
    const { data } = useContext(MetricsContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Track scroll position to show/hide scroll-to-bottom button
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const sendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg || isLoading) return;

        const userMsg = { role: 'user', text: msg };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Build history for the API (exclude the last user message since we send it as `message`)
            const history = newMessages.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                text: m.text,
            }));

            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, history }),
            });

            const data = await res.json();
            const botMsg = { role: 'model', text: data.reply || 'Sorry, I could not generate a response.' };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { role: 'model', text: `⚠️ Failed to reach the AI backend. Make sure the server is running.\n\nError: ${err.message}` },
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]" id="ai-assistant-page">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                        <Bot className="text-cyan-400" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
                            AI Assistant
                        </h1>
                        <p className="text-xs text-sky-400/60">Powered by Gemini 2.5 Flash • OS & PowerPulse expert</p>
                    </div>
                </div>
                {hasMessages && (
                    <button
                        onClick={clearChat}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm border border-transparent hover:border-red-500/20"
                        title="Clear conversation"
                    >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 min-h-0 glass-panel overflow-hidden flex flex-col relative" style={{ transform: 'none' }}>
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {!hasMessages && (
                        <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up">
                            <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 mb-6">
                                <Sparkles className="text-cyan-400" size={48} />
                            </div>
                            <h2 className="text-xl font-bold text-sky-100 mb-2">Ask me anything about Operating Systems</h2>
                            <p className="text-sky-400/60 text-sm max-w-md mb-8">
                                I can explain OS concepts, analyze your live system metrics, and help you understand PowerPulse features.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                                {SUGGESTED_QUESTIONS.map((q, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => sendMessage(q)}
                                        className="text-left px-4 py-3 rounded-xl text-sm text-sky-300/70 hover:text-cyan-300 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/20 hover:border-cyan-500/30 transition-all duration-200"
                                    >
                                        <span className="text-cyan-500 mr-2">→</span>{q}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role !== 'user' && (
                                    <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mt-1">
                                        <Bot size={16} className="text-cyan-400" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-sm shadow-md shadow-sky-500/10'
                                        : 'bg-sky-500/10 text-sky-100 border border-sky-500/20 rounded-bl-sm'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    ) : (
                                        <div
                                            className="ai-message-content"
                                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                                        />
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mt-1">
                                        <User size={16} className="text-cyan-400" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 items-start"
                        >
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                                <Bot size={16} className="text-cyan-400" />
                            </div>
                            <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                                <Loader2 size={16} className="text-cyan-400 animate-spin" />
                                <span className="text-sm text-sky-300/70">Thinking...</span>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom button */}
                <AnimatePresence>
                    {showScrollBtn && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={scrollToBottom}
                            className="absolute bottom-20 right-4 p-2 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:text-white hover:bg-sky-500/30 transition-all shadow-lg"
                        >
                            <ChevronDown size={18} />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Input Bar */}
                <div className="shrink-0 p-3 sm:p-4 border-t border-sky-500/10 bg-sky-500/5">
                    <div className="flex gap-2 items-end">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about OS concepts, your system, or PowerPulse features..."
                            rows={1}
                            className="flex-1 bg-sky-500/5 border border-sky-500/20 rounded-xl px-4 py-3 text-sm text-sky-100 placeholder-sky-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 resize-none transition-all"
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                            onInput={(e) => {
                                e.target.style.height = '44px';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                            id="ai-chat-input"
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className={`p-3 rounded-xl transition-all duration-200 shrink-0 ${input.trim() && !isLoading
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20'
                                : 'bg-sky-500/10 text-sky-400/40 cursor-not-allowed'
                                }`}
                            id="ai-send-button"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-sky-400/40 mt-2 text-center">
                        Gemini 2.5 Flash • Only answers OS & PowerPulse questions
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AIAssistant;
