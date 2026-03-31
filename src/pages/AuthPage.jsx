import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      // Map ugly Firebase errors to clean user messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      
      <div className="math-box dark-shadow" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
        
        {/* Toggle Header */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px dashed var(--grid-color)', paddingBottom: '1rem' }}>
          <button 
            className={`btn-sketch ${isLogin ? 'btn-primary' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{ flex: 1, padding: '0.75rem' }}
          >
            <LogIn size={20} /> Login
          </button>
          <button 
            className={`btn-sketch ${!isLogin ? 'btn-primary' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{ flex: 1, padding: '0.75rem' }}
          >
            <UserPlus size={20} /> Sign Up
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem' }}>
            {isLogin ? 'Welcome Back!' : 'Join the Desk'}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {isLogin ? 'Enter your credentials to access your meetings.' : 'Create an account to start analyzing transcripts.'}
          </p>
        </div>

        {error && (
          <div className="post-it pink" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transform: 'rotate(0deg)' }}>
            <AlertTriangle size={20} color="var(--accent-red)" />
            <span style={{ fontWeight: 'bold' }}>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="sketch-input"
              style={{
                padding: '0.75rem',
                border: '2px solid var(--text-dark)',
                fontFamily: 'inherit',
                fontSize: '1.1rem',
                outline: 'none',
                background: 'var(--bg-color)',
                boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.05)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '0.75rem',
                border: '2px solid var(--text-dark)',
                fontFamily: 'inherit',
                fontSize: '1.1rem',
                outline: 'none',
                background: 'var(--bg-color)',
                boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.05)'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-sketch btn-primary" 
            style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In to Meeting Hub' : 'Create Account')}
          </button>
        </form>

        {/* Decorative flair */}
        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', width: '20px', height: '20px', border: '2px solid var(--text-muted)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', top: '2rem', right: '-1rem', width: '30px', height: '2px', background: 'var(--post-it-yellow)', transform: 'rotate(45deg)' }}></div>
      </div>
    </div>
  );
}
