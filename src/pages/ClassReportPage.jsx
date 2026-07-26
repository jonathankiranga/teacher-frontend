import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStudents } from '../utils/api.js';
import { getClassReport, getCompetencies, saveCompetencyRatings } from '../utils/api.js';
import { jsPDF } from 'jspdf';

const LEVEL_LABELS = { EE: 'Exceeding Expectations', ME: 'Meeting Expectations', AE: 'Approaching Expectations', BE: 'Below Expectations' };

function getLevelColor(level) {
  if (level === 'EE') return { bg: '#E8F5E9', text: '#2E7D32' };
  if (level === 'ME') return { bg: '#E3F2FD', text: '#1565C0' };
  if (level === 'AE') return { bg: '#FFF3E0', text: '#E65100' };
  if (level === 'BE') return { bg: '#FFEBEE', text: '#C62828' };
  return { bg: '#F5F5F5', text: '#888' };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function LevelBadge({ level }) {
  if (!level) return <span className="text-xs" style={{ color: '#ccc' }}>—</span>;
  const c = getLevelColor(level);
  return <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: c.bg, color: c.text }}>{level}</span>;
}

function RatingSelect({ value, onChange }) {
  const levels = ['EE', 'ME', 'AE', 'BE'];
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className="input-field text-xs px-1 py-0.5" style={{ minWidth: 60 }}>
      <option value="">—</option>
      {levels.map(l => <option key={l} value={l}>{l}</option>)}
    </select>
  );
}

export default function ClassReportPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const { classId: paramClassId, term: paramTerm } = useParams();
  const reportRef = useRef(null);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(paramClassId || '');
  const [term, setTerm] = useState(paramTerm || 'Term 1');
  const [report, setReport] = useState(null);
  const [competencyDefs, setCompetencyDefs] = useState({ competencies: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editCompetencies, setEditCompetencies] = useState(false);
  const [editValues, setEditValues] = useState(false);
  const [editingRatings, setEditingRatings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!teacherId) navigate('/login', { replace: true });
  }, [teacherId, navigate]);

  useEffect(() => {
    if (!teacherId) return;
    fetchStudents(teacherId).then(data => {
      const list = data.students || [];
      const classMap = {};
      list.forEach(s => { if (s.class_id) classMap[s.class_id] = s.class_name || 'Class'; });
      setClasses(Object.entries(classMap).map(([id, name]) => ({ value: id, label: name })));
    }).catch(() => {});
    getCompetencies().then(setCompetencyDefs).catch(() => {});
  }, [teacherId]);

  useEffect(() => {
    if (classId && term) {
      setLoading(true);
      setEditCompetencies(false);
      setEditValues(false);
      setEditingRatings({});
      getClassReport(classId, term).then(data => {
        setReport(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [classId, term]);

  function getStudentLevel(avgPct) {
    if (avgPct === null || avgPct === undefined) return null;
    if (avgPct >= 80) return 'EE';
    if (avgPct >= 60) return 'ME';
    if (avgPct >= 40) return 'AE';
    return 'BE';
  }

  function handleRatingChange(studentId, competencyId, value) {
    setEditingRatings(prev => ({
      ...prev,
      [`${studentId}_${competencyId}`]: { student_id: studentId, competency_id: competencyId, rating: value, term }
    }));
  }

  async function handleSaveRatings(category) {
    const defs = category === 'competency' ? competencyDefs.competencies : competencyDefs.values;
    const ratings = defs.flatMap(comp => {
      const students = report.students || [];
      return students.map(s => {
        const key = `${s.student_id}_${comp.competency_id}`;
        return editingRatings[key] || {
          student_id: s.student_id,
          term,
          competency_id: comp.competency_id,
          rating: report.competencies?.student_ratings?.[s.student_id]?.[comp.competency_id] || null,
          teacher_id: teacherId
        };
      }).filter(r => r.rating);
    });
    if (ratings.length === 0) return;
    setSaving(true);
    try {
      await saveCompetencyRatings(ratings);
      const updated = await getClassReport(classId, term);
      setReport(updated);
      if (category === 'competency') setEditCompetencies(false);
      else setEditValues(false);
      setEditingRatings({});
    } catch (e) { alert('Failed to save ratings'); }
    setSaving(false);
  }

  const renderAreaLevelTable = useCallback(() => {
    if (!report) return null;
    return (
      <div className="overflow-x-auto" ref={reportRef}>
        <div className="card" style={{ minWidth: 600 }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#FAFAFA' }}>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>#</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Student</th>
                {report.learning_areas.map(a => (
                  <th key={a.area_id} className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>{a.area_name}</th>
                ))}
                <th className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Overall %</th>
                <th className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Level</th>
                <th className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {report.students.map((s, i) => {
                const c = getLevelColor(s.level);
                return (
                  <tr key={s.student_id} style={{ borderBottom: i < report.students.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                    <td className="px-3 py-2 text-xs" style={{ color: '#888' }}>{i + 1}</td>
                    <td className="px-3 py-2 text-sm font-medium" style={{ color: '#333' }}>{s.full_name}</td>
                    {report.learning_areas.map(a => {
                      const areaData = s.areas.find(ad => String(ad.area_id) === String(a.area_id));
                      const level = getStudentLevel(areaData?.avg_pct);
                      return (
                        <td key={a.area_id} className="px-2 py-2 text-center">
                          <LevelBadge level={level} />
                          {areaData?.avg_pct !== null && areaData?.avg_pct !== undefined && (
                            <div className="text-xs mt-0.5" style={{ color: '#999' }}>{areaData.avg_pct}%</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-sm text-center font-semibold" style={{ color: '#333' }}>{s.overall_avg !== null ? `${s.overall_avg}%` : '-'}</td>
                    <td className="px-2 py-2 text-center">
                      <LevelBadge level={s.level} />
                    </td>
                    <td className="px-2 py-2 text-sm text-center" style={{ color: '#888' }}>#{s.rank}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [report]);

  const renderCompetencySection = (category, title) => {
    if (!report) return null;
    const defs = category === 'competency' ? competencyDefs.competencies : competencyDefs.values;
    if (defs.length === 0) return null;
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#555' }}>{title}</h3>
        <div className="overflow-x-auto">
          <p className="text-xs mb-2" style={{ color: '#888' }}>Manage these ratings from the <strong>Competency</strong> module on the home page.</p>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Student</th>
                {defs.map(d => (
                  <th key={d.competency_id} className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>{d.competency_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.students.map((s, idx) => (
                <tr key={s.student_id} style={{ borderBottom: idx < report.students.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                  <td className="px-3 py-1.5 text-sm" style={{ color: '#333' }}>{s.full_name}</td>
                  {defs.map(d => {
                    const rating = report.competencies?.student_ratings?.[s.student_id]?.[d.competency_id];
                    return (
                      <td key={d.competency_id} className="px-2 py-1.5 text-center">
                        <LevelBadge level={rating} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  function handleDownloadPdf() {
    if (!report) return;
    setExporting(true);
    try {
      const doc = new jsPDF('landscape');
      const cls = report.class;
      const students = report.students || [];
      const areas = report.learning_areas || [];
      const aggregates = report.aggregates || {};
      const compDefs = competencyDefs.competencies || [];
      const valDefs = competencyDefs.values || [];
      let y = 18;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Class Report', 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Class: ${cls.class_name}`, 14, y);
      y += 6;
      doc.text(`Term: ${term}`, 14, y);
      y += 6;
      doc.text(`Total Students: ${aggregates.total_students || 0}`, 14, y);
      y += 10;

      // Learning Areas table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Learning Areas', 14, y);
      y += 7;

      const colX = [14];
      let curX = 14;
      colX.push(curX);
      curX += 48; // Name
      areas.forEach(() => { colX.push(curX); curX += 28; });
      colX.push(curX);
      curX += 20; // Overall %
      colX.push(curX);
      curX += 16; // Level
      colX.push(curX);
      curX += 14; // Rank

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('Student', colX[1] + 1, y);
      areas.forEach((a, i) => { doc.text(a.area_name.substring(0, 12), colX[i + 2] + 1, y); });
      doc.text('Overall %', colX[areas.length + 2] + 1, y);
      doc.text('Level', colX[areas.length + 3] + 1, y);
      doc.text('Rank', colX[areas.length + 4] + 1, y);
      y += 4;
      doc.line(14, y - 1, curX, y - 1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      students.forEach(s => {
        if (y > 185) { doc.addPage(); y = 18; doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.text('Student', colX[1] + 1, y); areas.forEach((a, i) => { doc.text(a.area_name.substring(0, 12), colX[i + 2] + 1, y); }); doc.text('Overall %', colX[areas.length + 2] + 1, y); doc.text('Level', colX[areas.length + 3] + 1, y); doc.text('Rank', colX[areas.length + 4] + 1, y); y += 4; doc.line(14, y - 1, curX, y - 1); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); }
        doc.text(s.full_name.substring(0, 22), colX[1] + 1, y);
        areas.forEach((a, ai) => {
          const areaData = s.areas.find(ad => String(ad.area_id) === String(a.area_id));
          const level = getStudentLevel(areaData?.avg_pct);
          doc.text(level || '-', colX[ai + 2] + 6, y);
        });
        doc.text(s.overall_avg !== null ? `${s.overall_avg}` : '-', colX[areas.length + 2] + 4, y);
        doc.text(s.level || '-', colX[areas.length + 3] + 4, y);
        doc.text(`#${s.rank}`, colX[areas.length + 4] + 3, y);
        y += 5;
      });

      // Competencies page
      if (compDefs.length > 0) {
        doc.addPage();
        y = 18;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Core Competencies', 14, y);
        y += 8;

        const cColX = [14];
        let cCurX = 14;
        cColX.push(cCurX);
        cCurX += 50;
        compDefs.forEach(() => { cColX.push(cCurX); cCurX += 30; });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('Student', cColX[1] + 1, y);
        compDefs.forEach((d, i) => { doc.text(d.competency_name.substring(0, 14), cColX[i + 2] + 1, y); });
        y += 4;
        doc.line(14, y - 1, cCurX, y - 1);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        students.forEach(s => {
          if (y > 185) { doc.addPage(); y = 18; doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.text('Student', cColX[1] + 1, y); compDefs.forEach((d, i) => { doc.text(d.competency_name.substring(0, 14), cColX[i + 2] + 1, y); }); y += 4; doc.line(14, y - 1, cCurX, y - 1); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); }
          doc.text(s.full_name.substring(0, 22), cColX[1] + 1, y);
          compDefs.forEach((d, i) => {
            const rating = report.competencies?.student_ratings?.[s.student_id]?.[d.competency_id] || '-';
            doc.text(rating, cColX[i + 2] + 6, y);
          });
          y += 5;
        });
      }

      // Values page
      if (valDefs.length > 0) {
        doc.addPage();
        y = 18;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Core Values', 14, y);
        y += 8;

        const vColX = [14];
        let vCurX = 14;
        vColX.push(vCurX);
        vCurX += 50;
        valDefs.forEach(() => { vColX.push(vCurX); vCurX += 30; });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('Student', vColX[1] + 1, y);
        valDefs.forEach((d, i) => { doc.text(d.competency_name.substring(0, 14), vColX[i + 2] + 1, y); });
        y += 4;
        doc.line(14, y - 1, vCurX, y - 1);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        students.forEach(s => {
          if (y > 185) { doc.addPage(); y = 18; doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.text('Student', vColX[1] + 1, y); valDefs.forEach((d, i) => { doc.text(d.competency_name.substring(0, 14), vColX[i + 2] + 1, y); }); y += 4; doc.line(14, y - 1, vCurX, y - 1); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); }
          doc.text(s.full_name.substring(0, 22), vColX[1] + 1, y);
          valDefs.forEach((d, i) => {
            const rating = report.competencies?.student_ratings?.[s.student_id]?.[d.competency_id] || '-';
            doc.text(rating, vColX[i + 2] + 6, y);
          });
          y += 5;
        });
      }

      // Summary page
      doc.addPage();
      y = 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Performance Summary', 14, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setFillColor(243, 229, 245);
      doc.rect(14, y - 5, 60, 8, 'F');
      doc.text(`Total Students: ${aggregates.total_students || 0}`, 16, y);
      y += 10;
      doc.setFillColor(232, 245, 233);
      doc.rect(14, y - 5, 60, 8, 'F');
      doc.text(`Class Average: ${aggregates.class_average !== null ? aggregates.class_average + '%' : 'N/A'}`, 16, y);
      y += 10;
      doc.setFillColor(255, 243, 224);
      doc.rect(14, y - 5, 60, 8, 'F');
      doc.text(`Highest: ${aggregates.top_performers?.[0]?.overall_avg || 'N/A'}%`, 16, y);
      y += 10;
      doc.setFillColor(255, 235, 238);
      doc.rect(14, y - 5, 60, 8, 'F');
      doc.text(`Needs Support Lowest: ${aggregates.bottom_performers?.[aggregates.bottom_performers.length - 1]?.overall_avg || 'N/A'}%`, 16, y);
      y += 18;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Level Distribution', 14, y);
      y += 8;
      const levels = ['EE', 'ME', 'AE', 'BE'];
      const levelColors = [['#E8F5E9', '#2E7D32'], ['#E3F2FD', '#1565C0'], ['#FFF3E0', '#E65100'], ['#FFEBEE', '#C62828']];
      const totalStudents = aggregates.total_students || 1;
      levels.forEach((lv, i) => {
        const cnt = aggregates.level_counts?.[lv] || 0;
        if (cnt === 0) return;
        const barW = Math.round(cnt / totalStudents * 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(lv, 14, y);
        doc.setFillColor(240, 240, 240);
        doc.rect(32, y - 4, 120, 6, 'F');
        doc.setFillColor(...hexToRgb(levelColors[i][1]));
        doc.rect(32, y - 4, Math.max(barW, 4), 6, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`${cnt} (${aggregates.level_percentages?.[lv] || 0}%)`, 156, y);
        y += 8;
      });

      doc.save(`class-report-${cls.class_name}-${term}.pdf`);
    } catch (e) { console.error('PDF export error:', e); }
    setExporting(false);
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Class Report (CBC)</h1>
          {report && (
            <button onClick={handleDownloadPdf} disabled={exporting} className="btn-secondary text-sm">
              {exporting ? 'Exporting...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 gap-3 mb-4 max-w-md">
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
            <option value="">— Select Class —</option>
            {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={term} onChange={e => setTerm(e.target.value)} className="input-field">
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
          </div>
        )}

        {report && !loading && (
          <>
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="card px-4 py-2">
                <span className="text-gray-500">Class:</span>
                <span className="ml-2 font-semibold">{report.class.class_name}</span>
              </div>
              <div className="card px-4 py-2">
                <span className="text-gray-500">Students:</span>
                <span className="ml-2 font-semibold">{report.aggregates.total_students}</span>
              </div>
              {report.aggregates.class_average !== null && (
                <div className="card px-4 py-2">
                  <span className="text-gray-500">Class Avg:</span>
                  <span className="ml-2 font-semibold">{report.aggregates.class_average}%</span>
                </div>
              )}
              {Object.entries(report.aggregates.level_counts || {}).map(([level, count]) => {
                const c = getLevelColor(level);
                return count > 0 ? (
                  <div key={level} className="card px-4 py-2" style={{ backgroundColor: c.bg }}>
                    <span className="font-semibold" style={{ color: c.text }}>{level}: {count}</span>
                  </div>
                ) : null;
              })}
            </div>

            <h2 className="text-base font-bold mb-2" style={{ color: '#333' }}>Learning Areas</h2>
            {renderAreaLevelTable()}

            <div className="mt-6">
              {renderCompetencySection('competency', 'Core Competencies')}
            </div>

            <div className="mt-4">
              {renderCompetencySection('value', 'Core Values')}
            </div>

            <div className="text-center mt-4">
              <button onClick={() => window.print()} className="btn-secondary text-sm">Print</button>
            </div>

            <div className="mt-8 space-y-4">
              <h2 className="text-base font-bold" style={{ color: '#333' }}>Performance Summary</h2>

              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#555' }}>Class Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded" style={{ backgroundColor: '#F3E5F5' }}>
                    <div className="text-lg font-bold" style={{ color: '#7B4F9B' }}>{report.aggregates.total_students}</div>
                    <div className="text-xs" style={{ color: '#888' }}>Total Students</div>
                  </div>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: '#E8F5E9' }}>
                    <div className="text-lg font-bold" style={{ color: '#2E7D32' }}>{report.aggregates.class_average !== null ? `${report.aggregates.class_average}%` : 'N/A'}</div>
                    <div className="text-xs" style={{ color: '#888' }}>Class Average</div>
                  </div>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: '#FFF3E0' }}>
                    <div className="text-lg font-bold" style={{ color: '#E65100' }}>{report.aggregates.top_performers?.[0]?.overall_avg ? `${report.aggregates.top_performers[0].overall_avg}%` : 'N/A'}</div>
                    <div className="text-xs" style={{ color: '#888' }}>Highest Score</div>
                  </div>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: '#FFEBEE' }}>
                    <div className="text-lg font-bold" style={{ color: '#C62828' }}>{report.aggregates.bottom_performers?.[report.aggregates.bottom_performers.length - 1]?.overall_avg ? `${report.aggregates.bottom_performers[report.aggregates.bottom_performers.length - 1].overall_avg}%` : 'N/A'}</div>
                    <div className="text-xs" style={{ color: '#888' }}>Needs Support</div>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#555' }}>Level Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(report.aggregates.level_counts || {}).map(([level, count]) => {
                    if (count === 0) return null;
                    const c = getLevelColor(level);
                    const pct = report.aggregates.level_percentages?.[level] || 0;
                    const totalStudents = report.aggregates.total_students || 1;
                    const barW = Math.round(count / totalStudents * 100);
                    return (
                      <div key={level} className="flex items-center gap-3">
                        <span className="text-xs font-bold w-8" style={{ color: c.text }}>{level}</span>
                        <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: '#F0F0F0' }}>
                          <div className="h-full rounded flex items-center justify-end pr-1 text-xs font-medium text-white"
                            style={{ width: `${Math.max(barW, 4)}%`, backgroundColor: c.text }}>
                            {barW > 15 ? `${count}` : ''}
                          </div>
                        </div>
                        <span className="text-xs w-12 text-right" style={{ color: '#888' }}>{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#555' }}>Per-Area Class Averages</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Learning Area</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Class Average</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Students Assessed</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.aggregates.area_averages || []).map((area, i) => {
                        const pct = area.class_avg !== null ? area.class_avg : 0;
                        const barColor = pct >= 80 ? '#2E7D32' : pct >= 60 ? '#1565C0' : pct >= 40 ? '#E65100' : '#C62828';
                        return (
                          <tr key={area.area_id} style={{ borderBottom: i < (report.aggregates.area_averages?.length || 0) - 1 ? '1px solid #F0F0F0' : 'none' }}>
                            <td className="px-3 py-2 text-sm" style={{ color: '#333' }}>{area.area_name}</td>
                            <td className="px-3 py-2 text-sm text-center font-semibold" style={{ color: area.class_avg !== null ? '#333' : '#999' }}>
                              {area.class_avg !== null ? `${area.class_avg}%` : '—'}
                            </td>
                            <td className="px-3 py-2 text-sm text-center" style={{ color: '#666' }}>{area.student_count}</td>
                            <td className="px-3 py-2" style={{ minWidth: 150 }}>
                              {area.class_avg !== null && (
                                <div className="h-4 rounded overflow-hidden" style={{ backgroundColor: '#F0F0F0' }}>
                                  <div className="h-full rounded" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColor }} />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#2E7D32' }}>Top Performers (Exceeding Expectations)</h3>
                  {(report.aggregates.top_performers || []).length > 0 ? (
                    <ol className="space-y-2">
                      {report.aggregates.top_performers.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span style={{ color: '#333' }}>{s.full_name}</span>
                          <span className="ml-auto font-semibold" style={{ color: '#2E7D32' }}>EE — {LEVEL_LABELS.EE}</span>
                        </li>
                      ))}
                    </ol>
                  ) : <p className="text-xs" style={{ color: '#888' }}>No data</p>}
                </div>
                <div className="card p-5">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#C62828' }}>Needs Support (Below Expectations)</h3>
                  {(report.aggregates.bottom_performers || []).length > 0 ? (
                    <ol className="space-y-2">
                      {report.aggregates.bottom_performers.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span style={{ color: '#333' }}>{s.full_name}</span>
                          <span className="ml-auto font-semibold" style={{ color: '#C62828' }}>BE — {LEVEL_LABELS.BE}</span>
                        </li>
                      ))}
                    </ol>
                  ) : <p className="text-xs" style={{ color: '#888' }}>No data</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && classId && !report && (
          <div className="card p-12 text-center border border-gray-200">
            <p className="text-sm" style={{ color: '#888' }}>No report data available for this class and term.</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .navbar { display: none !important; }
          body { background: white !important; }
          .overflow-x-auto { overflow: visible !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  );
}
