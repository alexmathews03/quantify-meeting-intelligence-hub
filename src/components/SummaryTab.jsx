import { Download, AlertCircle, CheckSquare } from 'lucide-react';

export default function SummaryTab({ meeting }) {
  const decisions = meeting?.decisions || [];
  const actionItems = meeting?.actionItems || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Decisions Column */}
      <div className="math-box dark-shadow">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          <AlertCircle color="var(--accent-red)" /> Key Decisions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {decisions.map((item, idx) => (
            <div key={idx} className="post-it pink" style={{ padding: '1rem', minHeight: 'auto', fontSize: '1.1rem' }}>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Action Items Column */}
      <div className="math-box dark-shadow">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
            <CheckSquare color="var(--accent-ink)" /> Action Items
          </h2>
          <button className="btn-sketch btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Table Header like */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', fontWeight: 'bold', color: 'var(--text-muted)', borderBottom: '2px solid var(--grid-color)', paddingBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            <span>Task</span>
            <span>Owner</span>
            <span>Deadline</span>
          </div>
          
          {actionItems.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1.5fr 1fr 1fr', 
              alignItems: 'center',
              padding: '0.75rem 0', 
              borderBottom: '1px dashed var(--grid-color)' 
            }}>
              <span style={{ fontWeight: 500 }}>{item.text}</span>
              <span className="marker-highlight" style={{ width: 'fit-content' }}>{item.owner}</span>
              <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
