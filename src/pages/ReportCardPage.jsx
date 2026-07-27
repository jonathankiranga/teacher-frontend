import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentReport, getCumulativeReport } from '../utils/api.js';

export default function ReportCardPage() {
  const navigate = useNavigate();
  const { studentId, term: urlTerm } = useParams();
  const [report, setReport] = useState(null);
  const [cumulative, setCumulative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('single');
  const [selectedTerm, setSelectedTerm] = useState(urlTerm || 'Term 1');

  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const currentTerm = `Term ${Math.ceil((new Date().getMonth() + 1) / 4)}`;

  useEffect(() => {
    setSelectedTerm(urlTerm || currentTerm);
  }, [urlTerm]);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    Promise.all([
      getStudentReport(studentId, selectedTerm),
      getCumulativeReport(studentId, new Date().getFullYear()).catch(() => null)
    ]).then(([r, c]) => {
      setReport(r);
      setCumulative(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [studentId, selectedTerm]);

  function getLevel(pct) {
    if (pct >= 80) return 'EE';
    if (pct >= 60) return 'ME';
    if (pct >= 40) return 'AE';
    return 'BE';
  }

  function levelStyle(level) {
    const map = {
      EE: { bg: '#E8F5E9', text: '#2E7D32' },
      ME: { bg: '#E3F2FD', text: '#1565C0' },
      AE: { bg: '#FFF3E0', text: '#E65100' },
      BE: { bg: '#FFEBEE', text: '#C62828' }
    };
    return map[level] || { bg: '#F5F5F5', text: '#888' };
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!report) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <p style={{ color: '#888' }}>Report not found</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <button onClick={() => window.print()} className="btn-secondary text-sm">Print</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => setView('single')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: view === 'single' ? '#7B4F9B' : '#F0E6F6', color: view === 'single' ? '#fff' : '#7B4F9B' }}>Single Term</button>
            <button onClick={() => setView('cumulative')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: view === 'cumulative' ? '#7B4F9B' : '#F0E6F6', color: view === 'cumulative' ? '#fff' : '#7B4F9B' }}>Cumulative</button>
          </div>
          {view === 'single' && (
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="input-field text-sm" style={{ maxWidth: 140 }}>
              {terms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        <div className="card p-6 print:p-0 print:shadow-none print:border-0">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold" style={{ color: '#333' }}>CBC Progress Report</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>{report.student.full_name} — {report.student.class_name}</p>
            <p className="text-sm" style={{ color: '#888' }}>{view === 'single' ? report.term : 'Year ' + new Date().getFullYear()}</p>
          </div>

          {view === 'single' && (
            <>
              <table className="w-full mb-6">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Learning Area</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Average</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Level</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Strand Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {report.areas.map((a, i) => {
                    const pct = parseFloat(a.avg_pct);
                    const level = getLevel(pct);
                    const ls = levelStyle(level);
                    return (
                      <tr key={a.area_id} style={{ borderBottom: i < report.areas.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#333' }}>{a.area_name}</td>
                        <td className="px-4 py-3 text-sm text-center" style={{ color: '#666' }}>{a.avg_pct}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>
                            {level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#888' }}>
                          {a.strand_summary ? a.strand_summary.split(', ').map((s, j) => <div key={j}>{s}</div>) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4" style={{ borderColor: '#F0F0F0' }}>
                <div>
                  <span className="text-gray-500">Attendance:</span>
                  <span className="ml-2 font-semibold" style={{ color: '#333' }}>
                    {report.attendance?.present || 0} / {report.attendance?.total || '-'} days
                  </span>
                </div>
              </div>
            </>
          )}

          {view === 'cumulative' && cumulative ? (
            <>
              <table className="w-full mb-6">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Learning Area</th>
                    {terms.map(t => (
                      <th key={t} className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>{t}</th>
                    ))}
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0', backgroundColor: '#F3E8FF' }}>Average</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {cumulative.area_summary.map((a, i) => {
                    const overallPct = parseFloat(a.overall_avg || 0);
                    const level = getLevel(overallPct);
                    const ls = levelStyle(level);
                    return (
                      <tr key={a.area_name} style={{ borderBottom: i < cumulative.area_summary.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                        <td className="px-3 py-2.5 text-sm font-medium" style={{ color: '#333' }}>{a.area_name}</td>
                        {terms.map(t => {
                          const termData = cumulative.terms.find(td => td.term === t);
                          const areaData = termData?.areas?.find(ad => ad.area_name === a.area_name);
                          return (
                            <td key={t} className="px-3 py-2.5 text-sm text-center" style={{ color: areaData?.avg_pct ? '#333' : '#ccc' }}>
                              {areaData?.avg_pct ? `${areaData.avg_pct}%` : '-'}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 text-sm text-center font-bold" style={{ color: '#7B4F9B', backgroundColor: '#F8F0FF' }}>
                          {a.overall_avg ? `${a.overall_avg}%` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {a.overall_avg ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>
                              {level}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="border-t pt-4" style={{ borderColor: '#F0F0F0' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#555' }}>Attendance by Term</h3>
                <div className="grid grid-cols-3 gap-4">
                  {cumulative.terms.map(td => (
                    <div key={td.term} className="text-center p-2 rounded" style={{ backgroundColor: '#FAFAFA' }}>
                      <div className="text-xs font-medium" style={{ color: '#888' }}>{td.term}</div>
                      <div className="text-sm font-bold" style={{ color: '#333' }}>{td.attendance?.present || 0} / {td.attendance?.total || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : view === 'cumulative' && !cumulative ? (
            <div className="text-center py-8" style={{ color: '#888' }}>
              <p>Cumulative data not available. No previous term data found.</p>
            </div>
          ) : null}

          <div className="mt-6 pt-4 border-t text-center text-xs" style={{ borderColor: '#F0F0F0', color: '#aaa' }}>
            Generated by Education APP — powered by Smarternow Data Venture
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .navbar { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
