import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ListTodo, Activity, Loader } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import SummaryTab from '../components/SummaryTab';
import ChatTab from '../components/ChatTab';
import SentimentTab from '../components/SentimentTab';

export default function MeetingDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('summary');
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const docRef = doc(db, 'meetings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMeeting({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such meeting!");
        }
      } catch (err) {
        console.error("Error fetching meeting:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [id]);

  if (loading) {
    return (
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Loader className="spin-animation" style={{ animation: 'spin 2s linear infinite' }} /> Loading Meeting Data...
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!meeting) {
    return <div style={{ marginTop: '2rem' }}>Meeting not found.</div>;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem', fontWeight: 600 }}>
        <ArrowLeft size={20} /> Back to Desk
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{meeting.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{meeting.date} • {meeting.duration} • {meeting.participants.join(', ')}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px dashed var(--grid-color)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('summary')}
          className={`btn-sketch ${activeTab === 'summary' ? 'btn-primary' : ''}`}
          style={{ padding: '0.5rem 1.5rem', gap: '0.5rem', filter: activeTab === 'summary' ? 'drop-shadow(4px 4px 0px var(--text-dark))' : 'none' }}>
          <ListTodo size={20} /> Summary
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`btn-sketch ${activeTab === 'chat' ? 'btn-primary' : ''}`}
          style={{ padding: '0.5rem 1.5rem', gap: '0.5rem' }}>
          <MessageSquare size={20} /> Chatbot
        </button>
        <button 
          onClick={() => setActiveTab('sentiment')}
          className={`btn-sketch ${activeTab === 'sentiment' ? 'btn-primary' : ''}`}
          style={{ padding: '0.5rem 1.5rem', gap: '0.5rem' }}>
          <Activity size={20} /> Vibe Tracker
        </button>
      </div>

      <div style={{ minHeight: '500px' }}>
        {activeTab === 'summary' && <SummaryTab meeting={meeting} />}
        {activeTab === 'chat' && <ChatTab meeting={meeting} />}
        {activeTab === 'sentiment' && <SentimentTab meeting={meeting} />}
      </div>
    </div>
  );
}
