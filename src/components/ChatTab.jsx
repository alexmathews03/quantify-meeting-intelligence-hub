import { useState } from 'react';
import { Send, User, Bot } from 'lucide-react';
import { mockChatContext } from '../data/mockData';
import { queryTranscriptContext } from '../services/aiService';

export default function ChatTab({ meeting }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I have read this meeting transcript. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const currentInput = input;
    setInput('');
    
    try {
      const aiResponse = await queryTranscriptContext(currentInput, meeting?.transcriptContext || 'No transcript text was provided.');
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
  };

  return (
    <div className="math-box dark-shadow" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: '0' }}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '2px solid var(--text-dark)', background: 'var(--post-it-yellow)' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={24} /> Meeting Assistant
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ask questions about decisions, conflicts, or details from the transcript.</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <div style={{ 
              background: msg.role === 'user' ? 'var(--text-dark)' : 'white',
              border: msg.role === 'user' ? 'none' : '2px solid var(--text-dark)',
              padding: '0.5rem',
              borderRadius: '50%'
            }}>
              {msg.role === 'user' ? <User size={20} color="white" /> : <Bot size={20} color="var(--text-dark)" />}
            </div>
            
            <div style={{
              background: msg.role === 'user' ? 'var(--post-it-blue)' : 'var(--bg-color)',
              border: '2px solid var(--text-dark)',
              padding: '1rem',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              maxWidth: '75%',
              boxShadow: '3px 3px 0px rgba(0,0,0,0.1)'
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ padding: '1rem', borderTop: '2px solid var(--text-dark)', display: 'flex', gap: '1rem', background: 'white' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="e.g. What were Bob's main concerns?"
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '2px solid var(--text-dark)',
            fontFamily: 'inherit',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
        <button className="btn-sketch btn-primary" onClick={handleSend} style={{ padding: '0.75rem 1.5rem' }}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
