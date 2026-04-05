import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, MessageSquare, X } from 'lucide-react';
import { queryGlobalContext } from '../services/aiService';

export default function GlobalChat({ meetings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('global_chat');
      return saved ? JSON.parse(saved) : [{ role: 'assistant', content: 'Hello! I am QUAN, your workspace assistant. I have cross-referenced all your meetings. What would you like to know?' }];
    } catch { 
      return [{ role: 'assistant', content: 'Hello! I am QUAN, your workspace assistant. I have cross-referenced all your meetings. What would you like to know?' }]; 
    }
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try { sessionStorage.setItem('global_chat', JSON.stringify(messages)); }
    catch {}
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Map meetings to a concise format for the AI to limit tokens
      const meetingsContextData = meetings.map(m => ({
        title: m.title,
        date: m.date,
        participants: m.participants,
        overallSentiment: m.overallSentiment,
        decisions: m.decisions,
        actionItems: m.actionItems,
        embeddedChunks: m.embeddedChunks || []
      }));

      const aiResponse = await queryGlobalContext(currentInput, meetingsContextData);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="btn-sketch btn-primary bounce-in"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            padding: '1rem',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          title="Open Workspace Chat"
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="math-box dark-shadow slide-up" style={{ 
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '380px',
          height: '600px',
          maxHeight: '80vh',
          display: 'flex', 
          flexDirection: 'column', 
          padding: '0',
          zIndex: 10000,
          backgroundColor: 'var(--bg-color)'
        }}>
          {/* Header */}
          <div style={{ padding: '1rem', borderBottom: '2px solid var(--text-dark)', background: 'var(--post-it-yellow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={24} /> Workspace QUAN
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cross-referenced {meetings.length} meetings</p>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} color={'var(--text-dark)'} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-color)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <div style={{ 
                  background: msg.role === 'user' ? 'var(--text-dark)' : 'white',
                  border: msg.role === 'user' ? 'none' : '2px solid var(--text-dark)',
                  padding: '0.4rem',
                  borderRadius: '50%'
                }}>
                  {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="var(--text-dark)" />}
                </div>
                
                <div style={{
                  background: msg.role === 'user' ? 'var(--post-it-blue)' : 'white',
                  border: '2px solid var(--text-dark)',
                  padding: '0.75rem',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  maxWidth: '80%',
                  boxShadow: '3px 3px 0px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4', fontSize: '0.9rem' }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Bot size={16} /> QUAN is thinking...
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '0.75rem', borderTop: '2px solid var(--text-dark)', display: 'flex', gap: '0.5rem', background: 'white' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about team tasks..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '2px solid var(--text-dark)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
              }}
              disabled={isTyping}
            />
            <button className="btn-sketch btn-primary" onClick={handleSend} disabled={isTyping} style={{ padding: '0.5rem 1rem' }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .bounce-in {
          animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
