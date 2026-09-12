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

// Distinct background colours for each learning area — up to 12 areas supported
const AREA_PALETTE = [
  { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9' },
  { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7' },
  { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  { bg: '#FCE4EC', text: '#880E4F', border: '#F48FB1' },
  { bg: '#F3E5F5', text: '#4A148C', border: '#CE93D8' },
  { bg: '#E0F7FA', text: '#006064', border: '#80DEEA' },
  { bg: '#FFFDE7', text: '#F57F17', border: '#FFF176' },
  { bg: '#FBE9E7', text: '#BF360C', border: '#FFAB91' },
  { bg: '#E8EAF6', text: '#1A237E', border: '#9FA8DA' },
  { bg: '#F1F8E9', text: '#33691E', border: '#C5E1A5' },
  { bg: '#E0F2F1', text: '#004D40', border: '#80CBC4' },
  { bg: '#FFF8E1', text: '#FF6F00', border: '#FFE082' },
];

// PDF RGB versions of the area palette
const AREA_PALETTE_PDF = [
  { bg: [227,242,253], text: [13,71,161]   },
  { bg: [232,245,233], text: [27,94,32]    },
  { bg: [255,243,224], text: [230,81,0]    },
  { bg: [252,228,236], text: [136,14,79]   },
  { bg: [243,229,245], text: [74,20,140]   },
  { bg: [224,247,250], text: [0,96,100]    },
  { bg: [255,253,231], text: [245,127,23]  },
  { bg: [251,233,231], text: [191,54,12]   },
  { bg: [232,234,246], text: [26,35,126]   },
  { bg: [241,248,233], text: [51,105,30]   },
  { bg: [224,242,241], text: [0,77,64]     },
  { bg: [255,248,225], text: [255,111,0]   },
];

function LevelBadge({ level }) {
  if (!level) return <span style={{ color: '#ccc', fontSize: 11 }}>-</span>;
  const c = LEVEL_COLOR[level] || { bg: '#F5F5F5', text: '#888', border: '#DDD' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 6px', borderRadius: 5,
      backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontWeight: 700, fontSize: 11,
    }}>{level}</span>
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
            {l} = {label}
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
              {(report.students || []).map(s => (
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

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const PW = 297, PH = 210;
      const ML = 10, MR = 10, MT = 12;
      const usableW = PW - ML - MR;

      const sessions = report.sessions || [];
      const areas    = report.learning_areas || [];
      const students = report.students || [];
      const cls      = report.class;

      const nameW    = 42;
      const overallW = 12;
      const totalDataCols = areas.length * sessions.length;
      const cellW = totalDataCols > 0
        ? Math.max(10, Math.floor((usableW - nameW - overallW) / totalDataCols))
        : 12;

      const LEVEL_RGB = {
        EE: [46, 125, 50],
        ME: [21, 101, 192],
        AE: [230, 81, 0],
        BE: [198, 40, 40],
      };

      function abbr(name) {
        if (!name) return '';
        const words = name.trim().split(/\s+/);
        if (words.length > 1 && name.length > 8) return words.map(w => w[0]).join('').toUpperCase().slice(0, 6);
        return name.slice(0, 8);
      }

      function drawPageHeader(doc, y) {
        doc.setFillColor(123, 79, 155);
        doc.rect(ML, y, usableW, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`CBC Class Report - ${cls.class_name} - ${report.term} - ${cls.academic_year}`, ML + 2, y + 4.8);
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(7);
        doc.text(`Students: ${students.length}  Sessions: ${sessions.length}`, PW - MR - 2, y + 4.8, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        return y + 9;
      }

      function drawTableHeader(doc, y) {
        const row1H = 7, row2H = 6;

        doc.setFillColor(240, 233, 248);
        doc.rect(ML, y, nameW, row1H + row2H, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text('Student', ML + 2, y + (row1H + row2H) / 2 + 2);

        let cx = ML + nameW;
        for (const sess of sessions) {
          const spanW = cellW * areas.length;
          doc.setFillColor(123, 79, 155);
          doc.rect(cx, y, spanW, row1H, 'F');
          doc.setDrawColor(100, 60, 130);
          doc.rect(cx, y, spanW, row1H);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(255, 255, 255);
          doc.text(sess.exam_type, cx + spanW / 2, y + 4.8, { align: 'center' });
          cx += spanW;
        }

        doc.setFillColor(240, 233, 248);
        doc.rect(cx, y, overallW, row1H + row2H, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(80, 80, 80);
        doc.text('OVR', cx + overallW / 2, y + (row1H + row2H) / 2 + 2, { align: 'center' });

        y += row1H;
        cx = ML + nameW;
        for (const sess of sessions) {
          for (let ai = 0; ai < areas.length; ai++) {
            const area = areas[ai];
            const isLast = ai === areas.length - 1;
            const ac = AREA_PALETTE_PDF[ai % AREA_PALETTE_PDF.length];
            doc.setFillColor(ac.bg[0], ac.bg[1], ac.bg[2]);
            doc.rect(cx, y, cellW, row2H, 'F');
            doc.setDrawColor(isLast ? 100 : 180, isLast ? 60 : 180, isLast ? 130 : 180);
            doc.setLineWidth(isLast ? 0.4 : 0.2);
            doc.rect(cx, y, cellW, row2H);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            doc.setTextColor(ac.text[0], ac.text[1], ac.text[2]);
            doc.text(abbr(area.area_name), cx + cellW / 2, y + 3.8, { align: 'center' });
            cx += cellW;
          }
        }

        doc.setLineWidth(0.4);
        doc.setDrawColor(150, 100, 180);
        doc.line(ML, y + row2H, ML + usableW, y + row2H);
        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
        return y + row2H;
      }

      const ROW_H = 5.5;
      function drawStudentRow(doc, st, y, isEven) {
        doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(ML, y, usableW, ROW_H, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(40, 40, 40);
        const nameStr = st.full_name.length > 26 ? st.full_name.slice(0, 25) + '...' : st.full_name;
        doc.text(nameStr, ML + 2, y + ROW_H / 2 + 1.8);

        let cx = ML + nameW;
        for (const sess of sessions) {
          for (let ai = 0; ai < areas.length; ai++) {
            const area = areas[ai];
            const cell = st.sessions?.[sess.session_id]?.[area.area_id];
            const level = cell?.level;
            const ac = AREA_PALETTE_PDF[ai % AREA_PALETTE_PDF.length];
            doc.setFillColor(ac.bg[0], ac.bg[1], ac.bg[2]);
            doc.rect(cx, y, cellW, ROW_H, 'F');
            if (level) {
              const rgb = LEVEL_RGB[level] || [100, 100, 100];
              doc.setTextColor(rgb[0], rgb[1], rgb[2]);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6);
              doc.text(level, cx + cellW / 2, y + ROW_H / 2 + 1.8, { align: 'center' });
            } else {
              doc.setTextColor(180, 180, 180);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(6);
              doc.text('-', cx + cellW / 2, y + ROW_H / 2 + 1.8, { align: 'center' });
            }
            cx += cellW;
          }
        }

        const overall = st.overall_level;
        if (overall) {
          const BG = { EE:[232,245,233], ME:[227,242,253], AE:[255,243,224], BE:[255,235,238] };
          const c = BG[overall] || [245,245,245];
          doc.setFillColor(c[0], c[1], c[2]);
          doc.rect(cx + 0.5, y + 0.5, overallW - 1, ROW_H - 1, 'F');
          const rgb = LEVEL_RGB[overall] || [100,100,100];
          doc.setTextColor(rgb[0], rgb[1], rgb[2]);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.text(overall, cx + overallW / 2, y + ROW_H / 2 + 1.8, { align: 'center' });
        }

        doc.setDrawColor(230, 230, 230);
        doc.line(ML, y + ROW_H, ML + usableW, y + ROW_H);
        doc.setTextColor(0, 0, 0);
      }

      function drawLegend(doc, y) {
        const levels = [['EE','Exceeding'],['ME','Meeting'],['AE','Approaching'],['BE','Below']];
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('Levels:', ML, y + 2.5);
        let lx = ML + 11;
        for (const [code, label] of levels) {
          const RGB = { EE:[46,125,50], ME:[21,101,192], AE:[230,81,0], BE:[198,40,40] };
          const rgb = RGB[code];
          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.rect(lx, y, 3, 3, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(`${code}=${label}`, lx + 4, y + 2.5);
          lx += 26;
        }
        lx += 4;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('Areas:', lx, y + 2.5);
        lx += 11;
        for (let ai = 0; ai < areas.length; ai++) {
          const ac = AREA_PALETTE_PDF[ai % AREA_PALETTE_PDF.length];
          doc.setFillColor(ac.bg[0], ac.bg[1], ac.bg[2]);
          doc.rect(lx, y, 3, 3, 'F');
          doc.setDrawColor(ac.text[0], ac.text[1], ac.text[2]);
          doc.rect(lx, y, 3, 3);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(abbr(areas[ai].area_name), lx + 4, y + 2.5);
          lx += 18;
          if (lx > PW - MR - 20) break;
        }
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
      }

      function drawFooter(doc, pageNum, totalPages) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(160, 160, 160);
        doc.text(`Generated by Smarternow Data Venture - Page ${pageNum} of ${totalPages}`, PW / 2, PH - 4, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      if (sessions.length === 0) {
        let y = drawPageHeader(doc, MT);
        doc.setFontSize(9);
        doc.text('No exam sessions found for this class / term / year.', ML, y + 10);
        drawFooter(doc, 1, 1);
        doc.save(`class-report-${cls.class_name}-${report.term}.pdf`);
        setExporting(false);
        return;
      }

      const headerH = 9 + 7 + 6;
      const legendH = 8;
      const availableForRows = PH - MT - headerH - legendH - 8;
      const rowsPerPage = Math.floor(availableForRows / ROW_H);

      const pages = [];
      for (let i = 0; i < students.length; i += rowsPerPage) {
        pages.push(students.slice(i, i + rowsPerPage));
      }
      if (pages.length === 0) pages.push([]);

      pages.forEach((pageStudents, pi) => {
        if (pi > 0) doc.addPage();
        let y = MT;
        y = drawPageHeader(doc, y);
        y = drawTableHeader(doc, y);
        pageStudents.forEach((st, ri) => {
          drawStudentRow(doc, st, y, ri % 2 === 0);
          y += ROW_H;
        });
        drawLegend(doc, PH - 12);
        drawFooter(doc, pi + 1, pages.length);
      });

      doc.save(`class-report-${cls.class_name}-${report.term}-${cls.academic_year}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    }
    setExporting(false);
  }

  const sessions = report?.sessions || [];
  const areas = report?.learning_areas || [];
  const students = report?.students || [];

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Navbar */}
      <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderBottom: '1px solid #E0E0E0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#7B4F9B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Back</button>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>Class Report (CBC)</span>
          </div>
          {report && (
            <button onClick={handleDownloadPdf} disabled={exporting}
              style={{ backgroundColor: '#7B4F9B', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: exporting ? 0.7 : 1 }}>
              {exporting ? 'Exporting...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '16px auto', padding: '0 12px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <select value={classId} onChange={e => setClassId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, minWidth: 160 }}>
            <option value="">Select Class</option>
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
                ['Term', `${report.term} - ${report.class.academic_year}`],
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

                {/* Main CBC matrix table */}
                <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                      <thead>
                        {/* Row 1: Session group headers */}
                        <tr>
                          <th rowSpan={2} style={{ padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '2px solid #DDD', borderRight: '1px solid #EEE', minWidth: 160, color: '#555', fontWeight: 700, verticalAlign: 'bottom', backgroundColor: '#F8F0FF' }}>
                            Student
                          </th>
                          {sessions.map(sess => (
                            <th key={sess.session_id} colSpan={areas.length}
                              style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #DDD', borderRight: '2px solid #DDD', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', backgroundColor: '#7B4F9B', color: '#fff' }}>
                              {sess.exam_type}
                              <span style={{ fontSize: 9, fontWeight: 400, marginLeft: 4, opacity: 0.8 }}>
                                {sess.status === 'Open' ? ' (Open)' : sess.status === 'Closed' ? ' (Closed)' : ''}
                              </span>
                            </th>
                          ))}
                          <th rowSpan={2} style={{ padding: '8px 8px', textAlign: 'center', borderBottom: '2px solid #DDD', color: '#555', fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: '#F8F0FF', verticalAlign: 'bottom', minWidth: 60 }}>
                            Overall
                          </th>
                        </tr>
                        {/* Row 2: Area sub-headers with colour coding */}
                        <tr>
                          {sessions.map(sess =>
                            areas.map((area, ai) => {
                              const ac = AREA_PALETTE[ai % AREA_PALETTE.length];
                              return (
                                <th key={`${sess.session_id}-${area.area_id}`}
                                  style={{
                                    padding: '4px 6px', textAlign: 'center', fontSize: 10, fontWeight: 700,
                                    borderBottom: '2px solid #DDD',
                                    borderRight: ai === areas.length - 1 ? '2px solid #DDD' : '1px solid rgba(0,0,0,0.08)',
                                    backgroundColor: ac.bg, color: ac.text,
                                    whiteSpace: 'nowrap', minWidth: 48,
                                  }}>
                                  {area.area_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)}
                                </th>
                              );
                            })
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((st, ri) => (
                          <tr key={st.student_id} style={{ borderBottom: ri < students.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                            <td style={{ padding: '7px 12px', fontWeight: 600, color: '#333', borderRight: '1px solid #EEE', whiteSpace: 'nowrap', backgroundColor: ri % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                              {st.full_name}
                            </td>
                            {sessions.map(sess =>
                              areas.map((area, ai) => {
                                const cell = st.sessions?.[sess.session_id]?.[area.area_id];
                                const ac = AREA_PALETTE[ai % AREA_PALETTE.length];
                                return (
                                  <td key={`${sess.session_id}-${area.area_id}`}
                                    style={{ padding: '4px 2px', textAlign: 'center', borderRight: ai === areas.length - 1 ? '2px solid #DDD' : '1px solid rgba(0,0,0,0.06)', backgroundColor: ac.bg }}>
                                    <LevelBadge level={cell?.level} />
                                  </td>
                                );
                              })
                            )}
                            <td style={{ padding: '5px 8px', textAlign: 'center', backgroundColor: ri % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                              <LevelBadge level={st.overall_level} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Area colour key */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, padding: '8px 12px', backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#555', marginRight: 4 }}>Subject Key:</span>
                  {areas.map((area, ai) => {
                    const ac = AREA_PALETTE[ai % AREA_PALETTE.length];
                    return (
                      <span key={area.area_id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: ac.bg, color: ac.text, border: `1px solid ${ac.border}`, fontWeight: 600 }}>
                        {area.area_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)} = {area.area_name}
                      </span>
                    );
                  })}
                </div>

                {/* Per-session level distribution */}
                <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 13, color: '#333', marginBottom: 12 }}>Level Distribution per Session</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {sessions.map(sess => {
                      const stats = report.aggregates.session_stats?.[sess.session_id] || { counts: {}, assessed: 0 };
                      return (
                        <div key={sess.session_id} style={{ border: '1px solid #EEE', borderRadius: 10, padding: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#333', marginBottom: 2 }}>{sess.exam_type}</div>
                          <div style={{ fontSize: 10, color: '#AAA', marginBottom: 8 }}>{sess.exam_name} - {stats.assessed} assessed</div>
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

                {/* Competencies */}
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
