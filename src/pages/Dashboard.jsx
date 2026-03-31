import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Search, FileText, CheckCircle, Smile, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredId, setHoveredId] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // We fetch documents belonging to the user
    const q = query(
      collection(db, 'meetings'), 
      where('userId', '==', user.uid)
    ); // Note: Removed orderBy to bypass need for composite indexes immediately

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid needing to build Firestore indexes during the hackathon
      docs.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setMeetings(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching meetings:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊 Great Vibe';
      case 'neutral': return '😐 Normal';
      case 'negative': return '😟 Tense';
      default: return '🙂';
    }
  };

  const colors = ['var(--post-it-yellow)', 'var(--post-it-blue)', 'var(--post-it-pink)'];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem' }}>Your <span className="marker-highlight">Desk</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>Found {meetings.length} transcripts stacked here.</p>
        </div>
        
        <div className="math-box dark-shadow" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '300px' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search meetings..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--text-muted)' }}>
            <Loader className="spin-animation" style={{ animation: 'spin 2s linear infinite' }} /> Loading Desk...
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : meetings.length === 0 ? (
          <div className="math-box dark-shadow" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
            <h2>Your desk is empty!</h2>
            <p>Upload a transcript from the home page to begin.</p>
          </div>
        ) : (
          meetings.map((meeting, index) => {
            const isHovered = hoveredId === meeting.id;
            const rotateAngle = isHovered ? '0deg' : `${(index % 2 === 0 ? 1 : -1) * (1 + (index * 0.5))}deg`;
            const baseColor = colors[index % colors.length];

            return (
            <div
              key={meeting.id}
              className="post-it"
              onMouseEnter={() => setHoveredId(meeting.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate(`/meeting/${meeting.id}`)}
              style={{
                backgroundColor: baseColor,
                transform: `rotate(${rotateAngle}) scale(${isHovered ? 1.05 : 1})`,
                zIndex: isHovered ? 10 : 1,
                cursor: 'pointer',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '2px solid rgba(0,0,0,0.1)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <Folder size={28} color="var(--text-dark)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid currentColor', paddingBottom: '2px' }}>
                    {meeting.date}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.4rem', lineHeight: '1.2' }}>{meeting.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(15, 23, 42, 0.7)', marginTop: '0.5rem' }}>
                  {meeting.duration} • {meeting.wordCount.toLocaleString()} words
                </p>
              </div>

              {/* Hover Stats Panel */}
              <div style={{ 
                height: isHovered ? '60px' : '0px', 
                opacity: isHovered ? 1 : 0, 
                overflow: 'hidden', 
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: isHovered ? '2px dashed rgba(0,0,0,0.2)' : 'none',
                paddingTop: isHovered ? '0.75rem' : '0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                  <CheckCircle size={18} color="var(--accent-ink)" />
                  {meeting.actionItems?.length || 0} Actions
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                  {getSentimentEmoji(meeting.overallSentiment)}
                </div>
              </div>
              
              <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }}></div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
