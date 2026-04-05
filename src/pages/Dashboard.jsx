import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Search, CheckCircle, Loader, Trash2, UploadCloud, FileText, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { parseUploadedTranscript } from '../services/aiService';
import { normalizeDate } from '../utils/dateUtils';
import GlobalChat from '../components/GlobalChat';
import { chunkText, generateEmbedding } from '../utils/ragUtils';


export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredId, setHoveredId] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorHeader, setErrorHeader] = useState(null);
  const fileInputRef = useRef(null);
  
  const sessionMeetingsRef = useRef({});

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'meetings'), 
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setMeetings(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching meetings:", error);
      setErrorHeader("Failed to sync with database. Check your connection or Firebase rules.");
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleDeleteMeeting = async (e, meetingId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await deleteDoc(doc(db, 'meetings', meetingId));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    setUploading(true);
    const fileArray = Array.from(files);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (!['txt', 'vtt', 'docx'].includes(file.name.toLowerCase().split('.').pop())) continue;

      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        let parsedData;
        try {
          parsedData = await parseUploadedTranscript(text);
        } catch (aiErr) {
          console.error("AI Error:", aiErr);
          parsedData = {
            title: `New: ${file.name.split('.')[0]}`,
            date: new Date().toLocaleDateString('en-GB'),
            duration: '-',
            wordCount: text.split(/\s+/).length,
            overallSentiment: 'neutral',
            participants: [],
            decisions: [],
            actionItems: [],
            sentimentTimeline: [],
            isSkeleton: true
          };
          if (aiErr.message?.includes("VITE_GROQ_API_KEY")) {
             alert(`Attention: Groq API Key missing. Created a 'Skeleton Card' for your file.`);
          }
        }

        const normalizedNewDate = normalizeDate(parsedData.date);
        let matchedMeetingId = sessionMeetingsRef.current[normalizedNewDate + parsedData.title];

        let generatedEmbeddedChunks = [];
        try {
          if (text && !parsedData.isSkeleton) {
            const rawChunks = chunkText(text, 150);
            for (const cText of rawChunks) {
              const vec = await generateEmbedding(cText);
              generatedEmbeddedChunks.push({ text: cText, vector: vec });
            }
          }
        } catch (embErr) {
          console.error("Gemini Embedding Error:", embErr);
          // Fails gracefully; chat will just skip vector search for this file
        }


        if (!matchedMeetingId && !parsedData.isSkeleton) {
          const existingQuery = query(collection(db, 'meetings'), where('userId', '==', user.uid));
          const existingDocs = await getDocs(existingQuery);

          existingDocs.forEach((docSnap) => {
            const data = docSnap.data();
            const normalizedExistingDate = normalizeDate(data.date);
            
            const cleanTitle = (s) => (s || '').toLowerCase().replace(/\bthe\b/g, '').replace(/\bmeeting\b/g, '').replace(/[^a-z0-9]/g, '').trim();
            const c1 = cleanTitle(data.title);
            const c2 = cleanTitle(parsedData.title);

            const isTitleMatch = c1.length > 3 && c2.length > 3 && (c1.includes(c2) || c2.includes(c1));
            
            if (
              (normalizedNewDate !== 'Unknown Date' && normalizedExistingDate === normalizedNewDate) ||
              isTitleMatch
            ) {
              matchedMeetingId = docSnap.id;
            }
          });
        }

        if (matchedMeetingId) {
          await updateDoc(doc(db, 'meetings', matchedMeetingId), {
            transcripts: arrayUnion({ fileName: file.name, text, uploadedAt: new Date().toISOString() }),
            decisions: arrayUnion(...(parsedData.decisions || [])),
            actionItems: arrayUnion(...(parsedData.actionItems || [])),
            embeddedChunks: arrayUnion(...generatedEmbeddedChunks)
          });

        } else {
          const docRef = await addDoc(collection(db, "meetings"), {
            userId: user.uid,
            title: parsedData.title,
            date: normalizedNewDate,
            duration: parsedData.duration,
            wordCount: parsedData.wordCount,
            overallSentiment: parsedData.overallSentiment,
            participants: parsedData.participants || [],
            decisions: parsedData.decisions || [],
            actionItems: parsedData.actionItems || [],
            sentimentTimeline: parsedData.sentimentTimeline || [],
            transcripts: [{ fileName: file.name, text, uploadedAt: new Date().toISOString() }],
            transcriptContext: text,
            embeddedChunks: generatedEmbeddedChunks,
            createdAt: serverTimestamp(),
            isSkeleton: parsedData.isSkeleton || false
          });
          sessionMeetingsRef.current[normalizedNewDate + parsedData.title] = docRef.id;
        }
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        alert(`Failed to save ${file.name}: ${err.message}`);
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊 Great Vibe';
      case 'neutral': return '😐 Normal';
      case 'negative': return '😟 Tense';
      default: return '🙂';
    }
  };

  const colors = ['var(--post-it-yellow)', 'var(--post-it-blue)', 'var(--post-it-pink)'];
  const filteredMeetings = meetings.filter(m => (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ marginTop: '2rem' }}>
      {errorHeader && (
        <div className="math-box red-shadow" style={{ padding: '1rem', marginBottom: '2rem', background: '#fee2e2', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} />
          {errorHeader}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem' }}>Your <span className="marker-highlight">Desk</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>Found {filteredMeetings.length} item{filteredMeetings.length !== 1 ? 's' : ''} on the desk.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="math-box dark-shadow" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '250px' }}>
            <Search size={20} color="var(--text-muted)" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem', fontFamily: 'inherit' }} />
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".txt,.vtt" multiple />
          <button className="btn-sketch btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader size={18} style={{ animation: 'spin 2s linear infinite' }} /> : <UploadCloud size={18} />}
            {uploading ? 'Processing...' : 'Upload'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--text-muted)' }}>
            <Loader style={{ animation: 'spin 2s linear infinite' }} /> Loading Desk...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="math-box dark-shadow" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
            <h2>{searchTerm ? 'Nothing matches.' : 'Your desk is empty!'}</h2>
            <p>Upload a transcript to begin.</p>
          </div>
        ) : (
          filteredMeetings.map((meeting, index) => {
            const isHovered = hoveredId === meeting.id;
            const rotateAngle = isHovered ? '0deg' : `${(index % 2 === 0 ? 1 : -1) * (1 + (index * 0.5))}deg`;
            const baseColor = colors[index % colors.length];

            return (
            <div key={meeting.id} className="post-it" onMouseEnter={() => setHoveredId(meeting.id)} onMouseLeave={() => setHoveredId(null)} onClick={() => navigate(`/meeting/${meeting.id}`)}
              style={{
                backgroundColor: baseColor,
                transform: `rotate(${rotateAngle}) scale(${isHovered ? 1.05 : 1})`,
                zIndex: isHovered ? 10 : 1,
                cursor: 'pointer',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '2px solid rgba(0,0,0,0.1)',
                opacity: meeting.isSkeleton ? 0.9 : 1
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  {meeting.isSkeleton ? <AlertTriangle size={24} color="var(--accent-red)" /> : <Folder size={28} color="var(--text-dark)" />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{meeting.date}</span>
                    <button onClick={(e) => handleDeleteMeeting(e, meeting.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', opacity: isHovered ? 1 : 0 }} title="Delete"><Trash2 size={16} color="var(--accent-red)" /></button>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.4rem' }}>{meeting.title}</h3>
                {meeting.isSkeleton && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 'bold' }}>AI ANALYSIS PENDING</p>}
                <p style={{ fontSize: '0.9rem', color: 'rgba(15,23,42,0.7)', marginTop: '0.5rem' }}>
                  {meeting.duration} • {meeting.wordCount?.toLocaleString()} words
                </p>
              </div>

              <div style={{ height: isHovered ? '60px' : '0px', opacity: isHovered ? 1 : 0, overflow: 'hidden', borderTop: isHovered ? '2px dashed rgba(0,0,0,0.2)' : 'none', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                  <CheckCircle size={18} color="var(--accent-ink)" /> {meeting.actionItems?.length || 0} Actions
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>{getSentimentEmoji(meeting.overallSentiment)}</div>
              </div>
            </div>
            );
          })
        )}
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      
      {/* Global Workspace Chatbot */}
      {!loading && <GlobalChat meetings={meetings} />}
    </div>
  );
}
