import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layers, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '2px solid var(--text-dark)',
        background: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>
            <div style={{ background: 'var(--post-it-yellow)', padding: '0.25rem', border: '2px solid var(--text-dark)', transform: 'rotate(-5deg)' }}>
              <Layers size={20} color="var(--text-dark)" />
            </div>
            <span className="marker-highlight">Meeting Hub</span>
          </Link>
        </div>
        
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {user ? (
            <>
              <Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-dark)', fontWeight: 600 }} className="sketch-underline">Desk</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--post-it-blue)', padding: '0.5rem 1rem', border: '2px solid var(--text-dark)', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                <User size={18} />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user.email.split('@')[0]}</span>
                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.5rem', color: 'var(--accent-red)' }} title="Sign Out">
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <Link to="/auth" className="btn-sketch btn-primary" style={{ textDecoration: 'none' }}>Sign In</Link>
          )}
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </>
  );
}
