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

  function levelStyle(level) {
    const map = {
      EE: { bg: '#E8F5E9', text: '#2E7D32' },
      ME: { bg: '#E3F2FD', text: '#1565C0' },
      AE: { bg: '#FFF3E0', text: '#E65100' },
      BE: { bg: '#FFEBEE', text: '#C62828' }
    };
    return map[level] || { bg: '#F5F5F5', text: '#888' };
  }

  function LevelBadge({ level }) {
    if (!level) return <span style={{ color: '#ccc' }}>—</span>;
    const ls = levelStyle(level);
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold"
        style={{ backgroundColor: ls.bg, color: ls.text }}>
        {level}
      </span>
    );
  }

  function formatDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return String(d).split('T')[0]; }
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

  const stu = report.student || {};
  const school = report.school || report.school_contact || {};
  const learningAreas = report.learning_areas || [];
  const att = report.attendance || {};
  const settings = report.report_settings || {};

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <div className="flex gap-2">
            <button onClick={handleDownloadPdf} className="btn-primary text-sm px-3 py-1.5">Download PDF</button>
            <button onClick={() => window.print()} className="btn-secondary text-sm px-3 py-1.5">Print</button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 print:hidden">
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

          {/* ============================================================
              SINGLE-TERM: KNEC CBC FORMAT
              ============================================================ */}
          {view === 'single' && (
            <>
              {/* ── School Header ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', border: '2px dashed #D0C0E0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#C0B0D0', fontSize: 9, textAlign: 'center', flexShrink: 0, marginRight: 12
                }}>SEAL</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', letterSpacing: 0.5 }}>
                    {school.school_name || 'SCHOOL NAME'}
                  </div>
                  {(school.contact_address || school.contact_phone || school.region) && (
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                      {[school.contact_address, school.contact_phone, school.region].filter(Boolean).join(' | ')}
                    </div>
                  )}
                  <div style={{ borderTop: '2px solid #7B4F9B', margin: '8px auto', width: '80%' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7B4F9B', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Competency-Based Curriculum (CBC) Progress Report
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
                    Academic Year: {report.year} &nbsp;|&nbsp; {report.term}
                  </div>
                </div>
              </div>

              {/* ── Student Details ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 12, padding: '10px 12px', backgroundColor: '#FAFAFA', borderRadius: 8, marginBottom: 16, border: '1px solid #EEE' }}>
                <div><span style={{ color: '#888' }}>Name: </span><strong>{stu.full_name || '—'}</strong></div>
                <div><span style={{ color: '#888' }}>Admission No: </span><strong>{stu.admission_number || '—'}</strong></div>
                <div><span style={{ color: '#888' }}>Class: </span><strong>{stu.class_name || '—'}</strong></div>
                <div><span style={{ color: '#888' }}>Gender: </span><strong>{stu.gender || '—'}</strong></div>
                <div><span style={{ color: '#888' }}>Date of Birth: </span><strong>{formatDate(stu.date_of_birth)}</strong></div>
                <div><span style={{ color: '#888' }}>Guardian: </span><strong>{stu.guardian_name || '—'}</strong></div>
                <div><span style={{ color: '#888' }}>Guardian Phone: </span><strong>{stu.guardian_phone || '—'}</strong></div>
                <div><span style={{ color: '#888' }}>Student ID: </span><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{stu.student_id}</span></div>
              </div>

              {/* ── Per Learning Area Grids ── */}
              {learningAreas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa', fontSize: 13 }}>
                  No exam results recorded for {report.term} {report.year}.
                </div>
              ) : (
                learningAreas.map(area => {
                  const sessions = area.sessions || [];
                  const subAreas = area.sub_areas || [];
                  return (
                    <div key={area.area_id} style={{ marginBottom: 20 }}>
                      <div style={{
                        backgroundColor: '#7B4F9B', color: '#fff', padding: '5px 10px',
                        borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {area.area_name}
                        </span>
                        {area.overall_level && (
                          <span style={{ fontSize: 11 }}>
                            Overall: <strong>{area.overall_level}</strong>
                          </span>
                        )}
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F3E8FF' }}>
                              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #D0C0E0', color: '#555', fontWeight: 600, minWidth: 120 }}>
                                Sub-Learning Area
                              </th>
                              {sessions.map(sess => (
                                <th key={sess.session_id} style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #D0C0E0', color: '#555', fontWeight: 600, minWidth: 80 }}>
                                  {sess.exam_name || sess.exam_type}
                                </th>
                              ))}
                              <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #D0C0E0', color: '#7B4F9B', fontWeight: 700, minWidth: 70, backgroundColor: '#EDD9FF' }}>
                                Overall
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {subAreas.length === 0 ? (
                              <tr>
                                <td colSpan={sessions.length + 2} style={{ textAlign: 'center', padding: '12px', color: '#bbb', fontStyle: 'italic' }}>
                                  No sub-areas configured
                                </td>
                              </tr>
                            ) : (
                              subAreas.map((sa, idx) => (
                                <tr key={sa.sub_area_id} style={{ borderBottom: '1px solid #F0EAF8', backgroundColor: idx % 2 === 0 ? '#fff' : '#FDFAFF' }}>
                                  <td style={{ padding: '6px 8px', color: '#333', fontWeight: 500 }}>{sa.sub_area_name}</td>
                                  {sessions.map(sess => {
                                    const r = sa.results && sa.results[sess.session_id];
                                    const ls = r && r.performance_level ? levelStyle(r.performance_level) : null;
                                    return (
                                      <td key={sess.session_id} style={{ textAlign: 'center', padding: '4px 6px' }}>
                                        {r ? (
                                          <>
                                            <div style={{ color: '#444', fontWeight: 500, fontSize: 11 }}>
                                              {r.score != null && r.out_of != null ? `${r.score}/${r.out_of}` : '—'}
                                            </div>
                                            {r.performance_level && ls && (
                                              <span style={{ display: 'inline-block', marginTop: 2, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, backgroundColor: ls.bg, color: ls.text }}>
                                                {r.performance_level}
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <span style={{ color: '#ccc' }}>—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td style={{ textAlign: 'center', padding: '4px 6px', backgroundColor: '#F8F2FF' }}>
                                    <LevelBadge level={sa.overall_level} />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Teacher remarks */}
                      <div style={{ padding: '6px 10px', borderTop: '1px solid #EEE', fontSize: 11, backgroundColor: '#FAFAFA', borderRadius: '0 0 6px 6px' }}>
                        <span style={{ color: '#888' }}>Teacher Remarks: </span>
                        <span style={{ color: area.remarks ? '#333' : '#ccc', fontStyle: area.remarks ? 'normal' : 'italic' }}>
                          {area.remarks || '_______________________________________________'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* ── Attendance ── */}
              <div style={{
                display: 'flex', gap: 24, padding: '10px 12px', borderRadius: 8,
                backgroundColor: '#F0F8FF', border: '1px solid #BBDEFB', fontSize: 12, marginBottom: 16, flexWrap: 'wrap'
              }}>
                <div><span style={{ color: '#888' }}>Days Present: </span><strong style={{ color: '#1565C0' }}>{att.present || 0}</strong></div>
                <div><span style={{ color: '#888' }}>Days Absent: </span><strong style={{ color: '#C62828' }}>{att.absent || 0}</strong></div>
                <div><span style={{ color: '#888' }}>Total School Days: </span><strong>{att.total || '—'}</strong></div>
              </div>

              {/* ── Signatures ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontSize: 11, marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#555', marginBottom: 8 }}>Class Teacher</div>
                  <div style={{ marginBottom: 6 }}>Name: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', minWidth: 120 }}>{settings.teacher_name || ''}</span></div>
                  <div style={{ marginBottom: 6 }}>Signature: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', minWidth: 100 }}>&nbsp;</span></div>
                  <div>Date: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', minWidth: 100 }}>&nbsp;</span></div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#555', marginBottom: 8 }}>HT / Principal</div>
                  <div style={{ marginBottom: 6 }}>Name: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', minWidth: 120 }}>{school.contact_name || ''}</span></div>
                  <div style={{ marginBottom: 6 }}>Signature: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', minWidth: 100 }}>&nbsp;</span></div>
                  <div style={{ marginTop: 16, border: '2px dashed #D0C0E0', padding: '8px 12px', borderRadius: 6, textAlign: 'center', color: '#bbb', fontSize: 10 }}>
                    School Stamp / Seal
                  </div>
                </div>
              </div>

              {/* ── Next Term ── */}
              {report.next_term_start && (
                <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>
                  <strong>Next Term Opens:</strong> {formatDate(report.next_term_start)}
                </div>
              )}

              {/* ── Competency Key ── */}
              <div style={{
                padding: '8px 12px', borderRadius: 6, backgroundColor: '#FAFAFA', border: '1px solid #EEE',
                fontSize: 10, display: 'flex', gap: 12, flexWrap: 'wrap', color: '#555'
              }}>
                <strong style={{ color: '#333' }}>KEY:</strong>
                {[
                  { code: 'EE', label: 'Exceeding Expectations' },
                  { code: 'ME', label: 'Meeting Expectations' },
                  { code: 'AE', label: 'Approaching Expectations' },
                  { code: 'BE', label: 'Below Expectations' }
                ].map(({ code, label }) => {
                  const ls = levelStyle(code);
                  return (
                    <span key={code}>
                      <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 3, backgroundColor: ls.bg, color: ls.text, fontWeight: 700, fontSize: 10 }}>{code}</span>
                      <span style={{ marginLeft: 3 }}>{label}</span>
                    </span>
                  );
                })}
              </div>
            </>
          )}

          {/* ============================================================
              CUMULATIVE VIEW — UNCHANGED
              ============================================================ */}
          {view === 'cumulative' && cumulative ? (
            <>
              <div className="text-center mb-4">
                <h2 className="text-base font-bold" style={{ color: '#333' }}>Cumulative Performance</h2>
                <p className="text-sm" style={{ color: '#888' }}>{stu.full_name} — Year {cumulative?.year || new Date().getFullYear()}</p>
              </div>
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
                        const level = a.sessions && a.sessions[s.session_id];
                        const ls = level ? levelStyle(level) : null;
                        return (
                          <td key={s.session_id} className="px-2 py-2.5 text-center">
                            {level && ls ? (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>{level}</span>
                            ) : (
                              <div className="text-sm" style={{ color: '#ccc' }}>-</div>
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
                  Columns show each CAT/exam session's competency level per learning area for Year {cumulative.year}.
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
          .navbar, .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
