import { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, ArrowRight, CheckCircle, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { parseUploadedTranscript } from '../services/aiService';

export default function LandingPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const processFile = async (file) => {
    if (!user) {
      alert("Please sign in first to upload transcripts.");
      navigate('/auth');
      return;
    }

    setUploading(true);
    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const parsedData = await parseUploadedTranscript(text);

      await addDoc(collection(db, "meetings"), {
        userId: user.uid,
        ...parsedData,
        transcriptContext: text,
        createdAt: serverTimestamp()
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Error processing transcript: " + err.message);
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8rem', marginTop: '4rem' }}>
      
      {/* Hero Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '4rem', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.2', marginBottom: '1.5rem' }}>
            <span className="marker-highlight">Stop Double Work.</span><br />
            <span className="marker-highlight" style={{ display: 'inline-block', marginTop: '0.5rem' }}>Start Doing.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px' }}>
            Drop your long, messy meeting transcripts onto the desk. We automatically extract decisions, flag action items, and map team sentiment.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-sketch btn-primary" onClick={() => fileInputRef.current?.click()} style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem' }}>
              Upload Transcript <ArrowRight size={20} />
            </button>
            <button className="btn-sketch" onClick={() => navigate('/dashboard')} style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem' }}>
              See an Example <Sparkles size={20} color="var(--post-it-yellow)" style={{stroke: 'var(--text-dark)'}}/>
            </button>
          </div>

          {/* Decorative elements */}
          <div className="post-it pink" style={{ position: 'absolute', top: '-4rem', right: '-2rem', transform: 'rotate(15deg) scale(0.8)', zIndex: -1 }}>
            <h4 className="sketch-underline">Idea:</h4>
            <p>Sync Jira?</p>
          </div>
        </div>

        {/* Upload Desk Area */}
        <div 
          className={`math-box ${isDragging ? 'red-shadow' : 'dark-shadow'}`} 
          style={{ 
            minHeight: '400px', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            borderStyle: isDragging ? 'dashed' : 'solid',
            borderWidth: '3px',
            borderColor: isDragging ? 'var(--accent-red)' : 'var(--text-dark)',
            background: isDragging ? '#fef2f2' : 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept=".txt,.vtt,.csv"
            multiple
          />

          {!uploading ? (
            <>
              <div style={{ background: 'var(--post-it-yellow)', padding: '1rem', borderRadius: '50%', border: '2px solid var(--text-dark)', marginBottom: '1.5rem' }}>
                <UploadCloud size={48} color="var(--text-dark)" />
              </div>
              <h2 style={{ fontSize: '1.5rem' }}>Drop Transcripts Here</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Supports .txt and .vtt files</p>
              <button className="btn-sketch" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </button>
            </>
          ) : (
            <>
              <FileText size={48} className="spin-animation" style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.5rem' }}>Analyzing Meeting...</h2>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </>
          )}
          
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', width: '30px', height: '30px', border: '2px solid var(--grid-color)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '40px', height: '2px', background: 'var(--accent-ink)', transform: 'rotate(-45deg)' }}></div>
        </div>
      </div>

      {/* How it Works Section */}
      <div style={{ paddingBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '3rem', display: 'inline-block' }}>
            <span className="sketch-underline">How it Works</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginTop: '1rem' }}>
            From a messy 20-page transcript to clear, actionable intelligence in seconds.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {/* Step 1 */}
          <div className="math-box dark-shadow" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', background: 'var(--post-it-yellow)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--text-dark)', fontWeight: 'bold', fontSize: '1.5rem' }}>1</div>
            <FileText size={32} color="var(--accent-ink)" style={{ marginBottom: '1rem' }} />
            <h3>Upload & Ingest</h3>
            <p style={{ color: 'var(--text-muted)' }}>Drag and drop plain text or VTT subtitle output from Zoom, Teams, or Meet. We ingest multiple files at once.</p>
          </div>

          {/* Step 2 */}
          <div className="math-box dark-shadow" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', background: 'var(--post-it-blue)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--text-dark)', fontWeight: 'bold', fontSize: '1.5rem' }}>2</div>
            <Settings size={32} color="var(--accent-ink)" style={{ marginBottom: '1rem' }} />
            <h3>Distill & Extract</h3>
            <p style={{ color: 'var(--text-muted)' }}>The AI reads the dialogue, filtering the noise. It isolates key decisions, extracts hard unassigned items, and graphs the conversation's mood.</p>
          </div>

          {/* Step 3 */}
          <div className="math-box dark-shadow" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', background: 'var(--post-it-pink)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--text-dark)', fontWeight: 'bold', fontSize: '1.5rem' }}>3</div>
            <Search size={32} color="var(--accent-ink)" style={{ marginBottom: '1rem' }} />
            <h3>Query Context</h3>
            <p style={{ color: 'var(--text-muted)' }}>Use the Chatbot to ask specific questions like <em>"Why did the team delay the launch?"</em> and get a referenced answer directly from the transcript.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
