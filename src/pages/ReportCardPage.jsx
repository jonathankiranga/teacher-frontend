import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentReport } from '../utils/api.js';

export default function ReportCardPage() {
  const navigate = useNavigate();
  const { studentId, term = 'Term 1' } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    getStudentReport(studentId, term).then(data => {
      setReport(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [studentId, term]);

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
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh' }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <button onClick={() => window.print()} className="btn-secondary text-sm">Print</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="card p-6 print:p-0 print:shadow-none print:border-0">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold" style={{ color: '#333' }}>CBC Progress Report</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>{report.student.full_name} — {report.student.class_name}</p>
            <p className="text-sm" style={{ color: '#888' }}>{report.term} 2026</p>
          </div>

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
                let level = 'BE';
                if (pct >= 80) level = 'EE';
                else if (pct >= 60) level = 'ME';
                else if (pct >= 40) level = 'AE';
                return (
                  <tr key={a.area_id} style={{ borderBottom: i < report.areas.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#333' }}>{a.area_name}</td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: '#666' }}>{a.avg_pct}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2.5 py-0.5 rounded text-xs font-bold" style={{
                        backgroundColor: level === 'EE' ? '#E8F5E9' : level === 'ME' ? '#E3F2FD' : level === 'AE' ? '#FFF3E0' : '#FFEBEE',
                        color: level === 'EE' ? '#2E7D32' : level === 'ME' ? '#1565C0' : level === 'AE' ? '#E65100' : '#C62828'
                      }}>
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
            <div>
              <span className="text-gray-500">Next Term:</span>
              <span className="ml-2 font-semibold" style={{ color: '#333' }}>Term 2</span>
            </div>
          </div>

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
