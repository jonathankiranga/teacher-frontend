import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentReport, getCumulativeReport, fetchStudents, getSchoolClasses } from '../utils/api.js';

export default function ReportCardPage() {
  const navigate = useNavigate();
  const { studentId: urlStudentId, term: urlTerm } = useParams();
  const schoolId = sessionStorage.getItem('school_id');
  const [report, setReport] = useState(null);
  const [cumulative, setCumulative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('single');
  const [selectedTerm, setSelectedTerm] = useState(urlTerm || 'Term 1');

  // Picker state (when no student is selected)
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [students, setStudents] = useState([]);

  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const currentTerm = `Term ${Math.ceil((new Date().getMonth() + 1) / 4)}`;

  useEffect(() => {
    setSelectedTerm(urlTerm || currentTerm);
  }, [urlTerm]);

  // Load school classes for the picker + full roster
  useEffect(() => {
    if (!schoolId) return;
    getSchoolClasses(schoolId).then(setClasses).catch(() => {});
    fetchStudents(sessionStorage.getItem('teacher_id')).then(d => setStudents(d.students || [])).catch(() => {});
  }, [schoolId]);

  // If a class is selected in picker, filter students to that class
  useEffect(() => {
    if (!classId) { setClassStudents([]); return; }
    const filtered = students.filter(s => String(s.class_id) === String(classId));
    setClassStudents(filtered);
  }, [classId, students]);

  useEffect(() => {
    if (!urlStudentId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getStudentReport(urlStudentId, selectedTerm),
      getCumulativeReport(urlStudentId, new Date().getFullYear()).catch(() => null)
    ]).then(([r, c]) => {
      setReport(r);
      setCumulative(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [urlStudentId, selectedTerm]);

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

  if (!urlStudentId) {
    return (
      <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
        <div className="navbar px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate('/home')} className="btn-ghost text-sm">← Back</button>
            <h1 className="text-base font-bold" style={{ color: '#333' }}>Student Report Card</h1>
            <div style={{ width: 60 }} />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          <div className="card p-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#555' }}>Select Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
              <option value="">— Select Class —</option>
              {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
            </select>
          </div>

          {classId && (
            <div className="card p-4">
              <p className="text-sm font-medium mb-3" style={{ color: '#555' }}>
                Select Student ({classStudents.length})
              </p>
              {classStudents.length === 0 ? (
                <p className="text-sm text-center" style={{ color: '#999' }}>No students in this class.</p>
              ) : (
                <div className="space-y-2">
                  {classStudents.map(s => (
                    <button key={s.student_id} onClick={() => navigate(`/exams/report/${s.student_id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-left"
                      style={{ backgroundColor: '#FAFAFA', border: '1px solid #EEE' }}>
                      <span className="text-sm font-medium" style={{ color: '#333' }}>{s.full_name}</span>
                      <span className="text-xs" style={{ color: '#7B4F9B' }}>View →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!report) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <p style={{ color: '#888' }}>Report not found</p>
    </div>
  );

  async function handleDownloadPdf() {
    try {
      const { downloadAcademicPdf } = await import('../utils/pdfExport.js');
      await downloadAcademicPdf(report, report?.student?.full_name, '', selectedTerm);
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message);
    }
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <div className="flex gap-2">
            <button onClick={handleDownloadPdf} className="btn-primary text-sm px-3 py-1.5">Download PDF</button>
            <button onClick={() => window.print()} className="btn-secondary text-sm px-3 py-1.5">Print</button>
          </div>
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
            <p className="text-sm" style={{ color: '#888' }}>{view === 'single' ? report.term : 'Year ' + (cumulative?.year || new Date().getFullYear())}</p>
          </div>

          {view === 'single' && (
            <>
              {(report.areas || []).map((a) => {
                const hasStrands = a.strands && a.strands.length > 0;
                const hasSummative = a.summative && a.summative.length > 0;
                return (
                  <div key={a.area_id} className="mb-6">
                    <h3 className="text-sm font-bold mb-2 px-1" style={{ color: '#7B4F9B', borderBottom: '2px solid #7B4F9B', paddingBottom: 4 }}>{a.area_name}</h3>
                    {hasStrands ? (
                      <table className="w-full mb-2">
                        <thead>
                          <tr style={{ backgroundColor: '#FAFAFA' }}>
                            <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Strand</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Sub-strand</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Mark</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.strands.map((strand) => (
                            (strand.sub_strands && strand.sub_strands.length > 0 ? strand.sub_strands : [{ sub_strand_name: '-', formative_score: '-', performance_level: null }]).map((sub, sIdx) => {
                              const ls = sub.performance_level ? levelStyle(sub.performance_level) : null;
                              return (
                                <tr key={`${strand.strand_id}-${sIdx}`} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                  {sIdx === 0 && (
                                    <td className="px-3 py-2 text-xs font-semibold align-top" style={{ color: '#555', verticalAlign: 'top' }} rowSpan={(strand.sub_strands && strand.sub_strands.length) || 1}>
                                      {strand.strand_name}
                                    </td>
                                  )}
                                  <td className="px-3 py-2 text-sm" style={{ color: '#333' }}>{sub.sub_strand_name}</td>
                                  <td className="px-3 py-2 text-sm text-center" style={{ color: '#666' }}>{sub.formative_score || '-'}</td>
                                  <td className="px-3 py-2 text-center">
                                    {ls ? (
                                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>
                                        {sub.performance_level}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#ccc' }}>-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      !hasSummative && (
                        <div className="px-3 py-2 text-sm" style={{ color: '#999' }}>-</div>
                      )
                    )}

                    {hasSummative && (
                      <div className="mt-2">
                        <h4 className="text-xs font-semibold uppercase mb-1 px-1" style={{ color: '#888' }}>Summative (CAT / End-Term)</h4>
                        {(() => {
                          const sessions = [];
                          const sessionKeys = new Set();
                          const subAreas = [];
                          const byCell = {};
                          a.summative.forEach((s) => {
                            if (!subAreas.includes(s.sub_area_name)) subAreas.push(s.sub_area_name || '-');
                          });
                          a.summative.forEach((s) => {
                            const key = `${s.exam_type}|${s.exam_name || ''}`;
                            if (!sessionKeys.has(key)) {
                              sessionKeys.add(key);
                              sessions.push({ key, label: s.exam_type, name: s.exam_name });
                            }
                            byCell[`${s.sub_area_name}|${key}`] = s;
                          });
                          return (
                            <table className="w-full" style={{ minWidth: sessions.length * 90 + 160 }}>
                              <thead>
                                <tr style={{ backgroundColor: '#FAFAFA' }}>
                                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Sub-area</th>
                                  {sessions.map((se) => (
                                    <th key={se.key} className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>
                                      {se.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {subAreas.map((sa, saIdx) => {
                                  return (
                                    <tr key={saIdx} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                      <td className="px-3 py-2 text-sm" style={{ color: '#333' }}>{sa}</td>
                                      {sessions.map((se) => {
                                        const s = byCell[`${sa}|${se.key}`];
                                        const ls = s && s.performance_level ? levelStyle(s.performance_level) : null;
                                        return (
                                          <td key={se.key} className="px-3 py-2 text-center">
                                            <div className="text-sm" style={{ color: s ? '#666' : '#ccc' }}>{s ? s.summative_score : '-'}</div>
                                            {s && ls && (
                                              <span className="inline-flex mt-0.5 px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>
                                                {s.performance_level}
                                              </span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

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
              <table className="w-full mb-3">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Learning Area</th>
                    {(cumulative.sessions || []).map(s => (
                      <th key={s.session_id} className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0', maxWidth: 90 }}>
                        <div>{s.label}</div>
                        <div className="text-[10px] font-normal normal-case" style={{ color: '#aaa' }}>{s.term}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(cumulative.areas || []).map((a, i) => (
                    <tr key={a.area_name} style={{ borderBottom: i < (cumulative.areas || []).length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <td className="px-3 py-2.5 text-sm font-medium" style={{ color: '#333' }}>{a.area_name}</td>
                      {(cumulative.sessions || []).map(s => {
                        const pct = a.sessions && a.sessions[s.session_id];
                        const level = pct ? getLevel(parseFloat(pct)) : null;
                        const ls = level ? levelStyle(level) : null;
                        return (
                          <td key={s.session_id} className="px-2 py-2.5 text-center">
                            {pct ? (
                              <div className="text-sm font-bold" style={{ color: '#333' }}>{pct}%</div>
                            ) : (
                              <div className="text-sm" style={{ color: '#ccc' }}>-</div>
                            )}
                            {ls && (
                              <div className="mt-0.5">
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>{level}</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {(cumulative.areas || []).length === 0 && (
                    <tr><td colSpan={(cumulative.sessions || []).length + 1} className="text-center py-6 text-sm" style={{ color: '#999' }}>No learning area results recorded.</td></tr>
                  )}
                </tbody>
              </table>

              {(cumulative.sessions || []).length > 0 && (
                <p className="text-xs mb-3" style={{ color: '#aaa' }}>
                  Columns show each CAT/exam session's percentage per learning area for Year {cumulative.year}.
                </p>
              )}

              <div className="border-t pt-4" style={{ borderColor: '#F0F0F0' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#555' }}>Attendance by Term</h3>
                <div className="grid grid-cols-3 gap-4">
                  {(cumulative.attendance || []).map(td => (
                    <div key={td.term} className="text-center">
                      <div className="text-xs font-medium" style={{ color: '#888' }}>{td.term}</div>
                      <div className="text-sm font-bold" style={{ color: '#333' }}>{td.present || 0} / {td.total || 0}</div>
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
