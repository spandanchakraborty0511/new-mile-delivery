import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am Aria, your AI logistics assistant. I can calculate quotes, check order statuses, or help reschedule deliveries. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message to local state
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Format messages for Anthropic SDK structure expected by backend
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role,
          content: m.text
        }));

      const res = await axios.post('/api/ai/chat', { messages: apiMessages }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Anthropic returns response.content array
      const responseData = res.data.response;
      let assistantText = 'I am not sure how to respond to that.';
      
      if (responseData && responseData.content && responseData.content.length > 0) {
        // Find the text block
        const textBlock = responseData.content.find(block => block.type === 'text');
        if (textBlock) {
          assistantText = textBlock.text;
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);
    } catch (err) {
      console.error('Chat error:', err);
      const backendError = err.response?.data?.error || err.message;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `Sorry, I encountered an error: ${backendError}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all transform hover:scale-105 z-50 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 transform transition-all">
          {/* Header */}
          <div className="px-4 py-3 bg-primary-600 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Aria AI Assistant</h3>
                <p className="text-xs text-primary-100">Powered by Gemini 3.5 Flash</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-primary-100 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={clsx(
                  "flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={clsx(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary-600 text-white rounded-tr-sm" 
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex space-x-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form onSubmit={handleSend} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Aria to check an order..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-full bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
