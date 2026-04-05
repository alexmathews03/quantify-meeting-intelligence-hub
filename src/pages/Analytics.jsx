import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, AlertTriangle, Loader, Users } from 'lucide-react';

export default function Analytics() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'meetings'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort chronologically (oldest to newest for the line chart progression)
        docs.sort((a, b) => {
          const tA = a.createdAt?.toMillis() || 0;
          const tB = b.createdAt?.toMillis() || 0;
          return tA - tB;
        });

        setMeetings(docs);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, [user]);

  // Transform data for Sentiment line chart
  const sentimentData = meetings.filter(m => !m.isSkeleton).map((m, index) => {
    let score = 50; // default neutral
    if (m.overallSentiment === 'positive') score = 90;
    if (m.overallSentiment === 'negative') score = 20;

    return {
      name: m.date !== 'Unknown Date' ? m.date : `Mtg ${index + 1}`,
      title: m.title || `Meeting ${index + 1}`,
      sentimentScore: score
    };
  });

  // Transform data for Action Items per owner bar chart
  const ownerTaskCounts = {};
  meetings.forEach(m => {
    if (m.actionItems && Array.isArray(m.actionItems)) {
      m.actionItems.forEach(task => {
        let owner = task.owner || "Unassigned";
        if (owner.toLowerCase() === 'team' || owner.toLowerCase() === 'unknown') owner = "Unassigned";
        if (owner.length > 20) owner = owner.substring(0, 20) + "..."; // sanitize long AI mistakes
        
        ownerTaskCounts[owner] = (ownerTaskCounts[owner] || 0) + 1;
      });
    }
  });

  const taskBarData = Object.keys(ownerTaskCounts).map(owner => ({
    name: owner,
    tasks: ownerTaskCounts[owner]
  })).sort((a, b) => b.tasks - a.tasks);

  if (loading) {
    return <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '4rem' }}><Loader className="spin" /> Loading Organization Health...</div>;
  }

  if (meetings.length === 0) {
    return (
      <div className="math-box dark-shadow" style={{ padding: '3rem', textAlign: 'center', marginTop: '4rem' }}>
        <h2><AlertTriangle size={30} color="var(--accent-red)" style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Not Enough Data</h2>
        <p>You need to upload some transcripts before we can generate analytics!</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem' }}>Workspace <span className="marker-highlight">Health</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyzed directly from {meetings.length} meeting transcripts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '3rem' }}>
        
        {/* Sentiment Line Chart */}
        <div className="math-box dark-shadow" style={{ padding: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--grid-color)', paddingBottom: '1rem' }}>
            <Activity color="var(--accent-red)" size={24} /> 
            Team Morale Over Time
          </h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentimentData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="sentimentScore" stroke="var(--accent-ink)" strokeWidth={4} activeDot={{ r: 8 }} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="name" tick={{ fontFamily: 'var(--font-main)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: 'var(--font-main)' }} />
                <Tooltip 
                  contentStyle={{ border: '2px solid var(--text-dark)', fontFamily: 'var(--font-main)', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)', borderRadius: 0 }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--accent-ink)' }}
                  formatter={(value, name, props) => [value, props.payload.title]}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Scores generated autonomously by Groq NLP sentiment analysis. 
          </p>
        </div>

        {/* Task Volume Bar Chart */}
        <div className="math-box dark-shadow" style={{ background: 'var(--post-it-yellow)', padding: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
            <Users color="var(--text-dark)" size={24} /> 
            Action Item Distribution
          </h3>
          {taskBarData.length === 0 ? (
            <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <b>No action items discovered yet!</b>
            </div>
          ) : (
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid stroke="rgba(0,0,0,0.1)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontFamily: 'var(--font-main)', fontSize: 12, fill: 'var(--text-dark)' }} />
                  <YAxis tick={{ fontFamily: 'var(--font-main)', fill: 'var(--text-dark)' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ border: '2px solid var(--text-dark)', fontFamily: 'var(--font-main)', borderRadius: 0 }} 
                  />
                  <Bar dataKey="tasks" fill="var(--text-dark)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dark)', opacity: 0.8, marginTop: '1rem' }}>
            Who is doing the most work according to your meeting transcripts?
          </p>
        </div>

      </div>
      <style>{`
        .spin { animation: spin 2s linear infinite; }
      `}</style>
    </div>
  );
}
