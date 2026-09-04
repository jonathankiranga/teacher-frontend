import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClassReport, getCompetencies, saveCompetencyRatings, getSchoolClasses } from '../utils/api.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LEVEL_COLOR = {
  EE: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  ME: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  AE: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  BE: { bg: '#FFEBEE', text: '#C62828', border: '#EF9A9A' },
};

function LevelBadge({ level, pct }) {
  if (!level) return <span style={{ color: '#ccc', fontSize: 11 }}>—</span>;
  const c = LEVEL_COLOR[level] || { bg: '#F5F5F5', text: '#888', border: '#DDD' };
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 6,
        backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`,
        fontWeight: 700, fontSize: 11,
      }}>{level}</span>
      {pct != null && (
        <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{pct}%</div>
      )}
    </div>
  );
}

function LegendBar() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      {[['EE','Exceeding Expectations'],['ME','Meeting Expectations'],['AE','Approaching Expectations'],['BE','Below Expectations']].map(([l, label]) => {
        const c = LEVEL_COLOR[l];
        return (
          <span key={l} style={{
            fontSize: 11, padding: '2px 10px', borderRadius: 6,
            backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`,
            fontWeight: 600,
          }}>
            {l} — {label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassReportPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const { classId: paramClassId, term: paramTerm } = useParams();

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(paramClassId || '');
  const [term, setTerm] = useState(paramTerm || 'Term 1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [competencyDefs, setCompetencyDefs] = useState({ competencies: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  useEffect(() => {
    if (!teacherId) return;
    const schoolId = sessionStorage.getItem('school_id');
    if (schoolId) {
      getSchoolClasses(schoolId).then(list => {
        setClasses((list || []).map(c => ({ value: c.class_id, label: c.class_name })));
      }).catch(() => {});
    }
    getCompetencies().then(setCompetencyDefs).catch(() => {});
  }, [teacherId]);

  useEffect(() => {
    if (!classId || !term) return;
    setLoading(true);
    setReport(null);
    getClassReport(classId, term, year)
      .then(data => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [classId, term, year]);

  // ── CBC performance-level colour helper ─────────────────────────────────────
  function levelColor(level) {
    return LEVEL_COLOR[level] || { bg: '#F5F5F5', text: '#888', border: '#DDD' };
  }

  // ── Competency rendering ────────────────────────────────────────────────────
  const renderCompetencySection = (category, title) => {
    if (!report) return null;
    const defs = category === 'competency' ? competencyDefs.competencies : competencyDefs.values;
    if (defs.length === 0) return null;
    return (
      <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 10 }}>{title}</h3>
        <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>Manage these from the Competency module on the home page.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#FAFAFA' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px', color: '#888', borderBottom: '1px solid #E0E0E0', whiteSpace: 'nowrap' }}>Student</th>
                {defs.map(d => (
                  <th key={d.competency_id} style={{ textAlign: 'center', padding: '6px 8px', color: '#888', borderBottom: '1px solid #E0E0E0', whiteSpace: 'nowrap' }}>{d.competency_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(report.students || []).map((s, idx) => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                  <td style={{ padding: '6px 10px', color: '#333', fontWeight: 500 }}>{s.full_name}</td>
                  {defs.map(d => (
                    <td key={d.competency_id} style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <LevelBadge level={report.competencies?.student_ratings?.[s.student_id]?.[d.competency_id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── PDF export ──────────────────────────────────────────────────────────────
  async function handleDownloadPdf() {
    if (!report) return;
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('landscape', 'mm', 'a3');
      const sessions = report.sessions || [];
      const areas = report.learning_areas || [];
      const students = report.students || [];
      const cls = report.class;

      let y = 16;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`CBC Class Report — ${cls.class_name}`, 14, y); y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Term: ${report.term}  ·  Year: ${cls.academic_year}  ·  Students: ${students.length}`, 14, y); y += 8;

      if (sessions.length === 0) {
        doc.text('No exam sessions found for this class / term / year.', 14, y);
        doc.save(`class-report-${cls.class_name}-${report.term}.pdf`);
        setExporting(false);
        return;
      }

      // Build header row: Student | Area × Session columns | Overall
      const colW = 22;
      const nameW = 48;
      let x = 14;

      const headerCells = [];
      headerCells.push({ x, w: nameW, label: 'Student' });
      x += nameW;

      for (const area of areas) {
        for (const sess of sessions) {
          headerCells.push({ x, w: colW, label: `${area.area_name.substring(0, 8)}\n${sess.exam_type}` });
          x += colW;
        }
      }
      headerCells.push({ x, w: colW, label: 'Overall' });

      // Draw header
      doc.setFillColor(243, 229, 245);
      doc.rect(14, y - 4, x + colW - 14, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      for (const cell of headerCells) {
        const lines = cell.label.split('\n');
        lines.forEach((line, li) => doc.text(line, cell.x + 1, y + li * 3.5));
      }
      y += 10;
      doc.line(14, y - 2, x + colW, y - 2);

      // Draw rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      for (const st of students) {
        if (y > 190) { doc.addPage(); y = 16; }
        doc.text(st.full_name.substring(0, 22), 14 + 1, y);
        let cx = 14 + nameW;
        for (const area of areas) {
          for (const sess of sessions) {
            const cell = st.sessions?.[sess.session_id]?.[area.area_id];
            doc.text(cell?.level || '—', cx + colW / 2 - 3, y);
            cx += colW;
          }
        }
        doc.text(st.overall_level || '—', cx + colW / 2 - 3, y);
        y += 5;
        doc.line(14, y - 2, x + colW, y - 2);
      }

      doc.save(`class-report-${cls.class_name}-${report.term}-${cls.academic_year}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    }
    setExporting(false);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const sessions = report?.sessions || [];
  const areas = report?.learning_areas || [];
  const students = report?.students || [];

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Navbar */}
      <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderBottom: '1px solid #E0E0E0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#7B4F9B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Back</button>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>Class Report (CBC)</span>
          </div>
          {report && (
            <button onClick={handleDownloadPdf} disabled={exporting}
              style={{ backgroundColor: '#7B4F9B', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: exporting ? 0.7 : 1 }}>
              {exporting ? 'Exporting…' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '16px auto', padding: '0 12px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <select value={classId} onChange={e => setClassId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, minWidth: 160 }}>
            <option value="">— Select Class —</option>
            {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={term} onChange={e => setTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13 }}>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13 }}>
            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #7B4F9B', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {report && !loading && (
          <>
            {/* Class summary bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {[
                ['Class', report.class.class_name],
                ['Term', `${report.term} · ${report.class.academic_year}`],
                ['Students', report.aggregates.total_students],
                ['Sessions', sessions.length],
              ].map(([label, val]) => (
                <div key={label} style={{ backgroundColor: '#fff', borderRadius: 10, padding: '8px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{label}:</span>
                  <span style={{ fontWeight: 700, marginLeft: 6, color: '#333' }}>{val}</span>
                </div>
              ))}
            </div>

            {sessions.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <p style={{ fontWeight: 700, color: '#333', marginBottom: 4 }}>No exam sessions found</p>
                <p style={{ fontSize: 13 }}>Go to CAT Management to open sessions for this class, term and year.</p>
              </div>
            ) : (
              <>
                <LegendBar />

                {/* ── Main CBC matrix table ─────────────────────────────────── */}
                {/* Columns: Student | [Area × Session]… | Overall */}
                <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                      <thead>
                        {/* Row 1: Learning area group headers */}
                        <tr style={{ backgroundColor: '#F8F0FF' }}>
                          <th rowSpan={2} style={{ padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '2px solid #DDD', borderRight: '1px solid #EEE', minWidth: 160, color: '#555', fontWeight: 700, verticalAlign: 'bottom' }}>
                            Student
                          </th>
                          {areas.map(area => (
                            <th key={area.area_id} colSpan={sessions.length}
                              style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #DDD', borderRight: '2px solid #DDD', color: '#7B4F9B', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', backgroundColor: '#F8F0FF' }}>
                              {area.area_name}
                            </th>
                          ))}
                          <th rowSpan={2} style={{ padding: '8px 8px', textAlign: 'center', borderBottom: '2px solid #DDD', color: '#555', fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: '#F8F0FF', verticalAlign: 'bottom', minWidth: 60 }}>
                            Overall
                          </th>
                        </tr>
                        {/* Row 2: Session sub-headers */}
                        <tr style={{ backgroundColor: '#FAFAFA' }}>
                          {areas.map(area => (
                            sessions.map((sess, si) => (
                              <th key={`${area.area_id}-${sess.session_id}`}
                                style={{
                                  padding: '5px 6px', textAlign: 'center', fontSize: 10, fontWeight: 600,
                                  borderBottom: '2px solid #DDD',
                                  borderRight: si === sessions.length - 1 ? '2px solid #DDD' : '1px solid #EEE',
                                  color: sess.status === 'Closed' ? '#333' : sess.status === 'Open' ? '#2E7D32' : '#AAA',
                                  whiteSpace: 'nowrap', minWidth: 64,
                                }}>
                                {sess.exam_type}
                                <div style={{ fontSize: 9, fontWeight: 400, color: '#AAA' }}>
                                  {sess.status === 'Open' ? '🟢' : sess.status === 'Closed' ? '🔒' : '⏳'} {sess.status}
                                </div>
                              </th>
                            ))
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((st, ri) => (
                          <tr key={st.student_id} style={{ borderBottom: ri < students.length - 1 ? '1px solid #F5F5F5' : 'none', backgroundColor: ri % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                            <td style={{ padding: '7px 12px', fontWeight: 600, color: '#333', borderRight: '1px solid #EEE', whiteSpace: 'nowrap' }}>
                              {st.full_name}
                            </td>
                            {areas.map(area => (
                              sessions.map((sess, si) => {
                                const cell = st.sessions?.[sess.session_id]?.[area.area_id];
                                return (
                                  <td key={`${area.area_id}-${sess.session_id}`}
                                    style={{ padding: '5px 4px', textAlign: 'center', borderRight: si === sessions.length - 1 ? '2px solid #DDD' : '1px solid #F0F0F0' }}>
                                    <LevelBadge level={cell?.level} pct={cell?.pct} />
                                  </td>
                                );
                              })
                            ))}
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              <LevelBadge level={st.overall_level} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Per-session level distribution ─────────────────────────── */}
                <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 13, color: '#333', marginBottom: 12 }}>Level Distribution per Session</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(180px, 1fr))`, gap: 12 }}>
                    {sessions.map(sess => {
                      const stats = report.aggregates.session_stats?.[sess.session_id] || { counts: {}, assessed: 0 };
                      return (
                        <div key={sess.session_id} style={{ border: '1px solid #EEE', borderRadius: 10, padding: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#333', marginBottom: 2 }}>{sess.exam_type}</div>
                          <div style={{ fontSize: 10, color: '#AAA', marginBottom: 8 }}>{sess.exam_name} · {stats.assessed} assessed</div>
                          {['EE','ME','AE','BE'].map(l => {
                            const cnt = stats.counts?.[l] || 0;
                            if (cnt === 0) return null;
                            const c = LEVEL_COLOR[l];
                            const pct = stats.assessed > 0 ? Math.round(cnt / stats.assessed * 100) : 0;
                            return (
                              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ width: 28, fontWeight: 700, fontSize: 11, color: c.text }}>{l}</span>
                                <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#F0F0F0', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.max(pct, 4)}%`, height: '100%', backgroundColor: c.text, borderRadius: 4 }} />
                                </div>
                                <span style={{ fontSize: 10, color: '#888', minWidth: 32, textAlign: 'right' }}>{cnt} ({pct}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Competencies ────────────────────────────────────────────── */}
                {renderCompetencySection('competency', 'Core Competencies')}
                {renderCompetencySection('value', 'Core Values')}
              </>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
