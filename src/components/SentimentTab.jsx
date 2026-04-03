import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Smile, Frown, Activity, Quote, ChevronDown, ChevronUp } from 'lucide-react';

export default function SentimentTab({ meeting }) {
  const data = meeting?.sentimentTimeline || [];
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [expandedHighlight, setExpandedHighlight] = useState(null);

  const handleChartClick = (e) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      setSelectedPoint(e.activePayload[0].payload);
    }
  };

  const toggleHighlight = (idx) => {
    setExpandedHighlight(expandedHighlight === idx ? null : idx);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="math-box dark-shadow" style={{ padding: '1rem', background: 'white' }}>
          <p className="sketch-underline" style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0 }}>Speaker: <span className="marker-highlight">{payload[0].payload.speaker}</span></p>
          <p style={{ margin: '0.25rem 0 0 0' }}>Vibe Score: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const getVibeLabel = (value) => {
    if (value >= 80) return 'Strong consensus and enthusiasm';
    if (value >= 60) return 'Generally positive and collaborative';
    if (value >= 40) return 'Neutral or mixed reactions';
    if (value >= 20) return 'Tension and disagreement present';
    return 'Significant conflict or frustration';
  };

  const getVibeColor = (value) => {
    if (value >= 60) return { bg: '#f0fdf4', border: 'var(--accent-ink)' };
    if (value <= 40) return { bg: '#fef2f2', border: 'var(--accent-red)' };
    return { bg: '#fffbeb', border: 'var(--post-it-yellow)' };
  };

  const highlights = data.filter(d => d.isHighlight);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 350px', gap: '2rem' }}>
      
      {/* Chart Dashboard */}
      <div className="math-box dark-shadow" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <Activity color="var(--accent-ink)" /> Conversation Mood Timeline
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Click on any point in the timeline to view the exact transcript quote.</p>
        
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
              <XAxis dataKey="time" stroke="var(--text-dark)" />
              <YAxis domain={[0, 100]} stroke="var(--text-dark)" />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 20 }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--accent-ink)" 
                strokeWidth={4} 
                dot={{ 
                  r: 8, 
                  stroke: 'var(--text-dark)', 
                  fill: 'var(--post-it-yellow)', 
                  strokeWidth: 2, 
                  cursor: 'pointer',
                  onClick: (data) => setSelectedPoint(data.payload)
                }}
                activeDot={{ 
                  r: 10, 
                  stroke: 'var(--text-dark)', 
                  fill: 'var(--accent-red)', 
                  strokeWidth: 2, 
                  cursor: 'pointer',
                  onClick: (data) => setSelectedPoint(data.payload)
                }}
                onClick={(e) => {
                  if (e && e.activePayload) setSelectedPoint(e.activePayload[0].payload);
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
        
        {selectedPoint ? (
          <div className="math-box dark-shadow" style={{ padding: '1.5rem', background: 'white' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
              <Quote size={20} color="var(--accent-ink)" /> Transcript Quote
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>[{selectedPoint.time}]</strong> • Vibe: {selectedPoint.value}</p>
            <div style={{ 
              background: getVibeColor(selectedPoint.value).bg, 
              padding: '1rem', 
              borderLeft: `4px solid ${getVibeColor(selectedPoint.value).border}`, 
              fontStyle: 'italic', 
              marginBottom: '0.5rem',
              lineHeight: '1.5'
            }}>
              "{selectedPoint.textSegment}"
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>— {selectedPoint.speaker}</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {getVibeLabel(selectedPoint.value)}
            </p>
          </div>
        ) : (
          <div className="post-it blue">
            <h3 style={{ marginTop: 0 }}>Examine the Dialogue</h3>
            <p>Click on any point in the chart to the left to view the raw conversation segment that caused that mood score.</p>
          </div>
        )}

        {highlights.length > 0 && (
          <h3 style={{ margin: '0.5rem 0 0 0', paddingBottom: '0.5rem', borderBottom: '2px solid var(--grid-color)' }}>Key Highlights</h3>
        )}
        
        {highlights.map((hl, idx) => {
          const isExpanded = expandedHighlight === idx;
          const colors = getVibeColor(hl.value);
          
          return (
            <div 
              key={idx} 
              className={`post-it ${hl.value >= 50 ? 'green' : 'pink'}`} 
              style={{ cursor: 'pointer', padding: '1rem', transition: 'all 0.3s ease' }} 
              onClick={() => toggleHighlight(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: isExpanded ? '0.75rem' : 0 }}>
                  {hl.value >= 50 ? <Smile size={18} /> : <Frown size={18} />} 
                  {hl.value >= 50 ? 'Consensus' : 'Conflict'} — [{hl.time}]
                </h4>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              
              {isExpanded && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ 
                    background: colors.bg, 
                    padding: '0.75rem', 
                    borderLeft: `4px solid ${colors.border}`,
                    fontStyle: 'italic',
                    lineHeight: '1.5',
                    marginBottom: '0.75rem'
                  }}>
                    "{hl.textSegment}"
                  </div>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>— {hl.speaker}</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Vibe Score: {hl.value}/100 — {getVibeLabel(hl.value)}
                  </p>
                </div>
              )}
              
              {!isExpanded && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                  Significant shift detected from {hl.speaker}. <span style={{ textDecoration: 'underline', fontSize: '0.85rem' }}>Click to expand</span>
                </p>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
