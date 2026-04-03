import { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, Activity, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { parseUploadedTranscript } from '../services/aiService';
import { normalizeDate } from '../utils/dateUtils';

import logoQuantify from '../assets/logo_quantify.jpg';
import imgSummary from '../assets/feature_summary.png';
import imgVibe from '../assets/feature_vibe.png';
import imgChat from '../assets/feature_chat.png';

export default function LandingPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Page Scroll
  const pageRef = useRef(null);
  const { scrollYProgress: pageScroll } = useScroll({ target: pageRef, offset: ["start start", "end end"] });
  const smoothPageScroll = useSpring(pageScroll, { stiffness: 100, damping: 30 });

  // Carousel Scroll
  const carouselRef = useRef(null);
  const { scrollYProgress: carouselScroll } = useScroll({
    target: carouselRef,
    offset: ["start start", "end end"]
  });

  const smoothCarouselScroll = useSpring(carouselScroll, { stiffness: 100, damping: 30 });

  // Parallax elements
  const postItY = useTransform(smoothPageScroll, [0, 0.2], [0, -300]);
  const heroOpacity = useTransform(smoothPageScroll, [0, 0.1], [1, 0]);
  const deskScale = useTransform(smoothPageScroll, [0, 0.08], [1, 1.05]);

  const sessionMeetingsRef = useRef({});

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const isValidFileType = (file) => {
    const ext = file.name.toLowerCase().split('.').pop();
    return ['txt', 'vtt', 'docx'].includes(ext);
  };

  const processFiles = async (files) => {
    if (!user) {
      alert("Please sign in first to upload transcripts.");
      navigate('/auth');
      return;
    }
    setUploading(true);
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (!isValidFileType(file)) continue;

      setUploadStatus(`Processing ${i + 1}/${fileArray.length}: ${file.name}...`);

      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        setUploadStatus(`Analyzing ${file.name}...`);

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
            isSkeleton: true,
            error: aiErr.message
          };
        }

        const normalizedNewDate = normalizeDate(parsedData.date);
        setUploadStatus(`Organizing ${file.name}...`);

        let matchedMeetingId = sessionMeetingsRef.current[normalizedNewDate + parsedData.title];

        if (!matchedMeetingId && !parsedData.isSkeleton) {
          const existingQuery = query(collection(db, 'meetings'), where('userId', '==', user.uid));
          const existingDocs = await getDocs(existingQuery);

          existingDocs.forEach((docSnap) => {
            const data = docSnap.data();
            const normalizedExistingDate = normalizeDate(data.date);
            const cleanTitle = (s) => (s || '').toLowerCase().replace(/\bthe\b/g, '').replace(/\bmeeting\b/g, '').replace(/[^a-z0-9]/g, '').trim();
            const isTitleMatch = cleanTitle(data.title).length > 3 && cleanTitle(parsedData.title).length > 3 && (cleanTitle(data.title).includes(cleanTitle(parsedData.title)) || cleanTitle(parsedData.title).includes(cleanTitle(data.title)));

            if ((normalizedNewDate !== 'Unknown Date' && normalizedExistingDate === normalizedNewDate) || isTitleMatch) {
              matchedMeetingId = docSnap.id;
            }
          });
        }

        if (matchedMeetingId) {
          const meetingRef = doc(db, 'meetings', matchedMeetingId);
          await updateDoc(meetingRef, {
            transcripts: arrayUnion({ fileName: file.name, text: text, uploadedAt: new Date().toISOString() }),
            decisions: arrayUnion(...(parsedData.decisions || [])),
            actionItems: arrayUnion(...(parsedData.actionItems || [])),
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
            transcripts: [{ fileName: file.name, text: text, uploadedAt: new Date().toISOString() }],
            transcriptContext: text,
            createdAt: serverTimestamp(),
            isSkeleton: parsedData.isSkeleton || false
          });
          sessionMeetingsRef.current[normalizedNewDate + parsedData.title] = docRef.id;
        }
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
      }
    }
    setUploading(false);
    navigate('/dashboard');
  };

  const carouselData = [
    {
      icon: Sparkles,
      title: "The Ghostwriter",
      description: "Structured Intelligence. Every decision, action, and insight captured instantly.",
      image: imgSummary
    },
    {
      icon: Activity,
      title: "The Mood Ring",
      description: "Atmospheric Awareness. Identify technical blockers and sentiment peaks before they stall development.",
      image: imgVibe
    },
    {
      icon: MessageSquare,
      title: "The Oracle",
      description: "Instant Recall. Chat with your meeting history to recover exactly what Sarah said at 2:15 PM.",
      image: imgChat
    }
  ];

  const RotatingDoor = () => {
    // 3D rotation logic with deeper perspective
    const d1 = useTransform(smoothCarouselScroll, [0, 0.33], [0, -90]);
    const o1 = useTransform(smoothCarouselScroll, [0, 0.33], [1, 0]);
    const zindex1 = useTransform(smoothCarouselScroll, [0, 0.33], [10, 0]);

    const d2 = useTransform(smoothCarouselScroll, [0, 0.33, 0.66], [90, 0, -90]);
    const o2 = useTransform(smoothCarouselScroll, [0, 0.25, 0.33, 0.58, 0.66], [0, 1, 1, 1, 0]);
    const zindex2 = useTransform(smoothCarouselScroll, [0, 0.33, 0.66], [0, 10, 0]);

    const d3 = useTransform(smoothCarouselScroll, [0.33, 0.66, 1], [90, 0, 0]);
    const o3 = useTransform(smoothCarouselScroll, [0.33, 0.5, 0.66, 1], [0, 0.8, 1, 1]);
    const zindex3 = useTransform(smoothCarouselScroll, [0.33, 0.66, 1], [1, 5, 10]);

    const rotations = [d1, d2, d3];
    const opacities = [o1, o2, o3];
    const zIndices = [zindex1, zindex2, zindex3];

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', perspective: '2000px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {carouselData.map((feature, idx) => (
          <motion.div
            key={idx}
            style={{
              position: 'absolute',
              width: '90%',
              maxWidth: '1200px',
              left: '50%',
              x: '-50%',
              rotateY: rotations[idx],
              opacity: opacities[idx],
              zIndex: zIndices[idx],
              transformStyle: 'preserve-3d',
              padding: '1.5rem',
              // Use a proper window frame structure
              background: 'white',
              border: '4px solid var(--text-dark)',
              boxShadow: '15px 15px 0px rgba(0,0,0,0.1)'
            }}
          >
            {/* Proper Window Frame Header */}
            <div style={{ display: 'flex', gap: '0.6rem', paddingBottom: '1.5rem', borderBottom: '2px solid var(--grid-color)', marginBottom: '2rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
              <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}> {feature.title.toUpperCase()} // STATUS: ACTIVE </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: '3rem', alignItems: 'center' }}>
              <div style={{ border: '2px solid var(--grid-color)', padding: '0.5rem', background: '#f8f9fa' }}>
                <img src={feature.image} alt={feature.title} style={{ width: '100%', display: 'block' }} />
              </div>

              <div>
                <div style={{ background: 'var(--post-it-yellow)', padding: '1.2rem', borderRadius: '4px', border: '3px solid var(--text-dark)', width: 'fit-content', marginBottom: '1.5rem', transform: 'rotate(-2deg)' }}>
                  <feature.icon size={48} />
                </div>
                <h2 style={{ fontSize: '3.8rem', lineHeight: '1', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>{feature.title}</h2>
                <p style={{ fontSize: '1.5rem', lineHeight: '1.4', color: 'var(--text-muted)', fontWeight: 500 }}>{feature.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div ref={pageRef} style={{ background: 'transparent' }}>

      {/* 1. HERO SECTION */}
      <motion.section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '4rem',
          paddingTop: '6rem',
          opacity: heroOpacity
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '4rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <motion.h1
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ fontSize: '5rem', lineHeight: '1.1', marginBottom: '1.5rem' }}
            >
              <span className="marker-highlight">Stop Double Work.</span><br />
              <span className="marker-highlight" style={{ display: 'inline-block', marginTop: '0.5rem' }}>Start Doing.</span>
            </motion.h1>
            <motion.p
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '500px' }}
            >
              The most intelligent meeting desk for fast-moving teams. We distill the chaos so you can focus on the next move.
            </motion.p>

            <motion.div
              style={{ y: postItY, position: 'absolute', top: '-4rem', right: '-2rem', transform: 'rotate(15deg) scale(0.8)', zIndex: -1 }}
              className="post-it pink no-print"
            >
              <h4 className="sketch-underline">Idea:</h4>
              <p>Sync Jira?</p>
            </motion.div>
          </div>

          <motion.div
            className={`math-box ${isDragging ? 'red-shadow' : 'dark-shadow'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = e.dataTransfer.files;
              if (files?.length) processFiles(files);
            }}
            style={{
              scale: deskScale,
              minHeight: '450px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              borderStyle: isDragging ? 'dashed' : 'solid',
              borderWidth: '3px',
              borderColor: isDragging ? 'var(--accent-red)' : 'var(--text-dark)',
              background: isDragging ? '#fef2f2' : 'white',
              position: 'relative'
            }}
          >
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.length && processFiles(e.target.files)} style={{ display: 'none' }} accept=".txt,.vtt" multiple />

            {!uploading ? (
              <>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ background: 'var(--post-it-yellow)', padding: '1.2rem', borderRadius: '50%', border: '2px solid var(--text-dark)', marginBottom: '1.5rem' }}
                >
                  <UploadCloud size={56} color="var(--text-dark)" />
                </motion.div>
                <h2 style={{ fontSize: '2rem' }}>Drop Transcripts Here</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Supports .txt and .vtt files</p>
                <button className="btn-sketch btn-primary" onClick={() => fileInputRef.current?.click()} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                  Browse Files
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <FileText size={64} style={{ animation: 'spin 2s linear infinite' }} />
                <h2 style={{ fontSize: '1.8rem' }}>{uploadStatus || 'Working...'}</h2>
              </div>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* 2. THE CHAOS (PROBLEM) SECTION */}
      <section style={{ height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          style={{ zIndex: 2 }}
        >
          <h2 style={{ fontSize: '4rem', color: 'var(--accent-red)', marginBottom: '2rem', fontWeight: 900 }}>Meetings Are Loud. <br /><span style={{ color: 'var(--text-dark)' }}>QUANTIFY is Silent.</span></h2>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)', maxWidth: '800px', fontWeight: 500 }}>
            We've all been there—30 minutes into a call and no one has taken a single note. Quantify captures the raw dialogue and filters it into hard data.
          </p>
        </motion.div>

        {/* Decorative Blurred Texts */}
        <motion.div
          style={{ position: 'absolute', top: '10%', left: '5%', opacity: 0.1, filter: 'blur(2px)', fontSize: '2rem', transform: 'rotate(-5deg)' }}
          animate={{ x: [0, 50, 0] }} transition={{ repeat: Infinity, duration: 20 }}
        >
          "I think we should pivot... maybe next week... let's hop on another call..."
        </motion.div>
        <motion.div
          style={{ position: 'absolute', bottom: '20%', right: '10%', opacity: 0.1, filter: 'blur(3px)', fontSize: '2.5rem', transform: 'rotate(10deg)' }}
          animate={{ x: [0, -70, 0] }} transition={{ repeat: Infinity, duration: 25 }}
        >
          "Wait, who is owning the API? I thought Sarah was..."
        </motion.div>
      </section>

      {/* 3. ROTATING DOOR CAROUSEL SECTION */}
      <section ref={carouselRef} className="carousel-viewport" style={{ height: '400vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden' }}>
          <RotatingDoor />
        </div>
      </section>

      {/* 4. CLEAN FOOTER */}
      <footer style={{ padding: '8rem 0', textAlign: 'center', borderTop: '4px solid var(--text-dark)', background: '#fff' }}>
        <h2 style={{ fontSize: '3.5rem', marginBottom: '3rem', fontWeight: 900 }}>Ready to clean your desk?</h2>
        <button
          className="btn-sketch btn-primary"
          onClick={() => navigate('/auth')}
          style={{ padding: '1.5rem 4rem', fontSize: '1.5rem', boxShadow: '10px 10px 0px var(--text-dark)' }}
        >
          Claim My Desk Now
        </button>
        <div style={{ marginTop: '4rem', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
          QUANTIFY © 2026 • Your Productive Workspace
        </div>
      </footer>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
