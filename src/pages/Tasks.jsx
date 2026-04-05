import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CheckSquare, Square, Calendar, Loader, FileText, User } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for checking off tasks (fast, reliable for demo)
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quantify_completed_tasks')) || {};
    } catch { return {}; }
  });

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'meetings'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMeetings(docs);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('quantify_completed_tasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Extract all tasks
  let allTasks = [];
  meetings.forEach(m => {
    if (m.actionItems && Array.isArray(m.actionItems)) {
      m.actionItems.forEach((task, idx) => {
        allTasks.push({
          ...task,
          id: `${m.id}-task-${idx}`,
          meetingTitle: m.title,
          meetingDate: m.date
        });
      });
    }
  });

  // Sort tasks: pending first, then by date. But for simplicity, let's group dynamically
  const pendingTasks = allTasks.filter(t => !completedTasks[t.id]);
  const doneTasks = allTasks.filter(t => completedTasks[t.id]);

  if (loading) {
    return <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '4rem' }}><Loader className="spin" /> Loading Master Tasks...</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem' }}>Master <span className="marker-highlight">Action Board</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Found {allTasks.length} total tasks extracted automatically from your meetings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
        
        {/* Pending Tasks Panel */}
        <div className="math-box dark-shadow" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', background: 'var(--post-it-yellow)', borderBottom: '2px solid var(--text-dark)' }}>
            <h2 style={{ margin: 0 }}>To Do ({pendingTasks.length})</h2>
          </div>
          
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: '300px' }}>
            {pendingTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>You're all caught up!</p>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} 
                  className="task-card"
                  style={{ 
                    border: '2px solid var(--text-dark)', 
                    padding: '1rem', 
                    display: 'flex', 
                    gap: '1rem',
                    background: 'white',
                    boxShadow: '3px 3px 0px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}>
                  
                  <button onClick={() => toggleTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '2px' }}>
                    <Square size={24} color="var(--text-muted)" />
                  </button>
                  
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{task.text}</p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#f1f5f9', padding: '2px 6px', border: '1px solid #cbd5e1' }}>
                        <User size={14} /> {task.owner || 'Unassigned'}
                      </span>
                      {task.date && task.date !== '-' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', border: '1px solid #f87171' }}>
                          <Calendar size={14} /> Due: {task.date}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                        <FileText size={14} /> {task.meetingTitle}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Tasks Panel */}
        <div className="math-box dark-shadow" style={{ padding: '0', display: 'flex', flexDirection: 'column', opacity: 0.8 }}>
          <div style={{ padding: '1.5rem', background: '#e2e8f0', borderBottom: '2px solid var(--text-dark)' }}>
            <h2 style={{ margin: 0 }}>Completed ({doneTasks.length})</h2>
          </div>
          
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: '300px', background: '#f8fafc' }}>
            {doneTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Tick off tasks to see them here.</p>
            ) : (
              doneTasks.map(task => (
                <div key={task.id} 
                  style={{ 
                    border: '2px solid transparent', 
                    padding: '1rem', 
                    display: 'flex', 
                    gap: '1rem',
                  }}>
                  
                  <button onClick={() => toggleTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '2px' }}>
                    <CheckSquare size={24} color="var(--accent-ink)" />
                  </button>
                  
                  <div style={{ flex: 1, textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{task.text}</p>
                    <span style={{ fontSize: '0.8rem' }}>{task.owner || 'Unassigned'} • {task.meetingTitle}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
      <style>{`
        .spin { animation: spin 2s linear infinite; }
        .task-card:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0px rgba(0,0,0,0.1) !important; }
      `}</style>
    </div>
  );
}
