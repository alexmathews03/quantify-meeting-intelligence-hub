import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ListTodo, Activity, Loader, Trash2, FileText, UploadCloud, X, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { parseUploadedTranscript } from '../services/aiService';
import { normalizeDate } from '../utils/dateUtils';
import SummaryTab from '../components/SummaryTab';
import ChatTab from '../components/ChatTab';
import SentimentTab from '../components/SentimentTab';

export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcripts, setTranscripts] = useState([]);
  const [addingTranscript, setAddingTranscript] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMeeting = async () => {
    try {
      const docRef = doc(db, 'meetings', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setMeeting(data);
        setTranscripts(data.transcripts || []);
      } else {
        console.error("No such meeting!");
      }
    } catch (err) {
      console.error("Error fetching meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const handleDeleteMeeting = async () => {
    if (!confirm('Are you sure you want to permanently delete this meeting and all its transcripts?')) return;
    try {
      await deleteDoc(doc(db, 'meetings', id));
      navigate('/dashboard');
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Failed to delete meeting.");
    }
  };

  const performFullSync = async (updatedTranscripts) => {
    setAddingTranscript(true);
    try {
      const fullText = updatedTranscripts.map(t => t.text).join('\n\n---\n\n');
      // Pass the meeting date as baseDate for accurate deadline calculation
      const parsedData = await parseUploadedTranscript(fullText, meeting.date);

      // Preserve completed status and deduplicate by text content
      const existingItems = (meeting.actionItems || []);
      const seenTexts = new Set();
      const finalItems = [];

      (parsedData.actionItems || []).forEach(newItem => {
        const normalized = newItem.text.trim().toLowerCase();
        if (!seenTexts.has(normalized)) {
          seenTexts.add(normalized);
          // Look for existing item to preserve completion status
          const existing = existingItems.find(old => old.text.trim().toLowerCase() === normalized);
          finalItems.push({ ...newItem, completed: existing ? existing.completed : false });
        }
      });

      const meetingRef = doc(db, 'meetings', id);
      await updateDoc(meetingRef, {
        transcripts: updatedTranscripts,
        decisions: parsedData.decisions || [],
        actionItems: finalItems,
        sentimentTimeline: parsedData.sentimentTimeline || [],
        participants: parsedData.participants || [],
        duration: parsedData.duration || meeting.duration,
        wordCount: parsedData.wordCount || meeting.wordCount,
        overallSentiment: parsedData.overallSentiment || meeting.overallSentiment,
        transcriptContext: fullText
      });

      await fetchMeeting();
    } catch (err) {
      console.error("Sync Error:", err);
      alert("Failed to sync meeting data: " + err.message);
    } finally {
      setAddingTranscript(false);
    }
  };

  const handleRemoveTranscript = async (index) => {
    if (transcripts.length <= 1) {
      alert("Cannot remove the last transcript. Delete the entire meeting instead.");
      return;
    }
    if (!confirm(`Remove "${transcripts[index].fileName}"? This will trigger a re-analysis.`)) return;
    
    const updated = [...transcripts];
    updated.splice(index, 1);
    await performFullSync(updated);
  };

  const handleMoveTranscript = async (index, direction) => {
    const updated = [...transcripts];
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= updated.length) return;
    [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
    await performFullSync(updated);
  };

  const handleAddTranscripts = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAddingTranscript(true);
    const updatedTranscripts = [...transcripts];
    
    for (const file of Array.from(files)) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (!['txt', 'vtt'].includes(ext)) continue;

      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        const checkData = await parseUploadedTranscript(text.substring(0, 5000));
        const normalizedCheckDate = normalizeDate(checkData.date);
        const normalizedMeetingDate = normalizeDate(meeting.date);

        if (normalizedCheckDate !== 'Unknown Date' && normalizedCheckDate !== normalizedMeetingDate) {
          alert(`Error: ${file.name} appears to be from ${checkData.date}, but this meeting is from ${meeting.date}. Transcripts from different dates must be uploaded as separate meetings.`);
          continue;
        }

        updatedTranscripts.push({
          fileName: file.name,
          text: text,
          uploadedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Error adding ${file.name}:`, err);
      }
    }

    if (updatedTranscripts.length > transcripts.length) {
      await performFullSync(updatedTranscripts);
    } else {
      setAddingTranscript(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) return <div className="layout-container" style={{ paddingTop: '5rem' }}><Loader className="spin-animation" /> Loading Details...</div>;
  if (!meeting) return <div className="layout-container" style={{ paddingTop: '5rem' }}>Meeting not found.</div>;

  return (
    <div className="layout-container" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginTop: '1rem' }}>
        <Link to="/dashboard" className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem', fontWeight: 600 }}>
          <ArrowLeft size={20} /> Back to Desk
        </Link>

        {/* Print-Only Report Header */}
        <div style={{ display: 'none' }} className="print-only">
          <div style={{ borderBottom: '4px solid var(--text-dark)', paddingBottom: '1.5rem', marginBottom: '3rem' }}>
            <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Internal Document</h4>
            <h1 style={{ fontSize: '3.5rem', margin: 0 }}>Meeting Intelligence Report</h1>
            <p style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{meeting.title}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{meeting.date} • {meeting.duration} • {(meeting.participants || []).join(', ')}</p>
          </div>
          <button 
            className="btn-sketch no-print" 
            onClick={handleDeleteMeeting}
            style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)', gap: '0.5rem' }}
          >
            <Trash2 size={18} /> Delete Meeting
          </button>
        </div>

        {/* Transcripts List */}
        {transcripts.length > 0 && (
          <div className="math-box no-print" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <FileText size={20} color="var(--text-muted)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Stacked Transcripts ({transcripts.length})</h3>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {transcripts.map((t, idx) => (
                <div key={idx} className="post-it yellow" style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem', 
                  padding: '0.5rem 1rem', minHeight: 'auto', transform: 'none',
                  border: '1px solid rgba(0,0,0,0.15)', fontSize: '0.9rem', fontWeight: 600,
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.05)'
                }}>
                  <span>{t.fileName}</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleMoveTranscript(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>
                      <ArrowLeft size={14} />
                    </button>
                    <button onClick={() => handleMoveTranscript(idx, 1)} disabled={idx === transcripts.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: idx === transcripts.length - 1 ? 0.3 : 1 }}>
                      <ArrowRight size={14} />
                    </button>
                    <button onClick={() => handleRemoveTranscript(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.25rem' }}>
                      <Trash2 size={14} color="var(--accent-red)" />
                    </button>
                  </div>
                </div>
              ))}
              
              <input type="file" ref={fileInputRef} onChange={handleAddTranscripts} style={{ display: 'none' }} accept=".txt,.vtt" multiple />
              <button 
                className="btn-sketch" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={addingTranscript}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem', background: 'white' }}
              >
                {addingTranscript ? <Loader size={16} className="spin-animation" style={{ animation: 'spin 2s linear infinite' }} /> : <UploadCloud size={16} />}
                Add Part
              </button>
            </div>
          </div>
        )}

        <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px dashed var(--grid-color)', paddingBottom: '1rem' }}>
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
          {activeTab === 'summary' && (
            <SummaryTab 
              meeting={meeting} 
              onToggleActionItem={async (idx) => {
                const updated = [...meeting.actionItems];
                updated[idx].completed = !updated[idx].completed;
                const meetingRef = doc(db, 'meetings', id);
                await updateDoc(meetingRef, { actionItems: updated });
                setMeeting(prev => ({ ...prev, actionItems: updated }));
              }} 
            />
          )}
          {activeTab === 'chat' && <ChatTab meeting={meeting} />}
          {activeTab === 'sentiment' && <SentimentTab meeting={meeting} />}
        </div>
      </div>
    </div>
  );
}
