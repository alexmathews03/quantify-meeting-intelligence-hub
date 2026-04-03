import { Download, AlertCircle, CheckSquare, Printer, Square } from 'lucide-react';

export default function SummaryTab({ meeting, onToggleActionItem }) {
  const decisions = meeting?.decisions || [];
  const actionItems = meeting?.actionItems || [];

  const exportCSV = () => {
    const pendingItems = actionItems.filter(item => !item.completed);
    if (pendingItems.length === 0) {
      alert("No pending action items to export.");
      return;
    }
    
    const header = 'Task,Owner,Deadline\n';
    const rows = pendingItems.map(item => {
      const text = (item.text || '').replace(/"/g, '""');
      const owner = (item.owner || '').replace(/"/g, '""');
      const date = (item.date || '').replace(/"/g, '""');
      return `"${text}","${owner}","${date}"`;
    }).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(meeting?.title || 'meeting').replace(/[^a-z0-9]/gi, '_')}_action_items.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPrint = () => {
    window.print();
  };

  return (
    <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '2.5rem' }}>
      
      {/* Decisions Column */}
      <div className="math-box dark-shadow" style={{ padding: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 800 }}>
          <AlertCircle color="var(--accent-red)" size={28} /> Key Decisions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {decisions.length > 0 ? decisions.map((item, idx) => (
            <div key={idx} className="post-it pink" style={{ padding: '1.25rem', minHeight: 'auto', fontSize: '1.15rem', transform: 'none', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)' }}>
              {item.text}
            </div>
          )) : (
            <p style={{ color: 'var(--text-muted)' }}>No key decisions extracted.</p>
          )}
        </div>
      </div>

      {/* Action Items Column */}
      <div className="math-box dark-shadow" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            {actionItems.some(i => i.completed) ? <CheckSquare color="var(--accent-ink)" size={28} /> : <Square color="var(--accent-ink)" size={28} />}
            Action Items
          </h2>
          <div className="no-print" style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-sketch btn-primary" onClick={exportCSV} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={18} /> Export CSV
            </button>
            <button className="btn-sketch" onClick={exportPrint} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Printer size={18} /> Print
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '40px 1.8fr 1fr 1fr', 
            fontWeight: 800, 
            color: 'var(--text-dark)', 
            borderBottom: '3px solid var(--text-dark)', 
            paddingBottom: '0.75rem', 
            textTransform: 'uppercase', 
            fontSize: '0.9rem', 
            letterSpacing: '0.05em' 
          }}>
            <span></span>
            <span>Task</span>
            <span style={{ textAlign: 'center' }}>Owner</span>
            <span style={{ textAlign: 'right' }}>Deadline</span>
          </div>
          
          {actionItems.length > 0 ? actionItems.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'grid', 
              gridTemplateColumns: '40px 1.8fr 1fr 1fr', 
              alignItems: 'center',
              padding: '1.25rem 0', 
              borderBottom: '1px dashed var(--grid-color)',
              opacity: item.completed ? 0.5 : 1,
              transition: 'opacity 0.2s'
            }}>
              <button 
                onClick={() => onToggleActionItem(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {item.completed ? <CheckSquare size={22} color="var(--accent-ink)" /> : <Square size={22} color="var(--grid-color)" />}
              </button>
              <span style={{ 
                fontWeight: 600, 
                fontSize: '1.05rem', 
                textDecoration: item.completed ? 'line-through' : 'none',
                paddingRight: '1rem'
              }}>
                {item.text}
              </span>
              <div style={{ textAlign: 'center' }}>
                <span className="marker-highlight" style={{ padding: '0.2rem 0.5rem' }}>{item.owner || '-'}</span>
              </div>
              <span style={{ 
                color: (item.date && item.date !== '-') ? 'var(--accent-red)' : 'var(--grid-color)', 
                fontWeight: 700, 
                textAlign: 'right' 
              }}>
                {(item.date && item.date !== '-') ? item.date : '--'}
              </span>
            </div>
          )) : (
            <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem' }}>No action items extracted.</p>
          )}
        </div>
      </div>

    </div>
  );
}
