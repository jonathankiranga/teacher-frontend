function formatCurrency(value) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

function cell(doc, text, x, y, w, h, opts = {}) {
  doc.rect(x, y, w, h);
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setFontSize(opts.size || 8.5);
  const lines = doc.splitTextToSize(String(text == null ? '' : text), w - 3);
  const lh = opts.lineHeight || 4;
  const maxLines = Math.max(1, Math.floor((h - 1) / lh));
  const ty = y + h / 2 + ((opts.size || 8.5) * 0.35) / Math.max(1, lines.length) - ((Math.min(lines.length, maxLines) - 1) * lh) / 2;
  doc.text(lines.slice(0, maxLines), x + 1.5, ty);
}

export async function downloadAcademicPdf(report, childName, phone, term) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const M = 12;
  const W = pageW - M * 2;
  const student = report?.student || {};
  const areas = report?.areas || [];
  const attendance = report?.attendance || {};
  const settings = report?.report_settings || {};
  const layout = settings?.layout_json || {};
  const layoutSections = Array.isArray(layout.sections) ? layout.sections : ['attendance', 'learning_areas'];
  const styles = layout.styles || {};
  const titleFontSize = styles.titleFontSize || 18;
  const sectionFontSize = styles.sectionFontSize || 11;
  const bodyFontSize = styles.bodyFontSize || 10;
  const reportTitle = layout.report_title || 'Education APP - Academic Report';

  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleFontSize);
  doc.text(reportTitle, 14, y);
  y += titleFontSize > 14 ? 10 : 8;
  doc.setFontSize(bodyFontSize);
  doc.setFont('helvetica', 'normal');
  if (phone) {
    doc.text(`Contact: ${phone}`, 14, y);
    y += 6;
  }
  doc.text(`Student: ${childName || student.full_name || 'Unknown'}`, 14, y);
  y += 6;
  doc.text(`Class: ${student.class_name || 'N/A'}`, 14, y);
  y += 6;
  doc.text(`Term: ${term}`, 14, y);
  y += 12;

  if (layoutSections.includes('attendance')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(sectionFontSize);
    doc.text('Attendance Summary', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodyFontSize);
    doc.text(`Total attendance logs: ${attendance.total || 0}`, 14, y);
    y += 6;
    doc.text(`Present count: ${attendance.present || 0}`, 14, y);
    y += 12;
  }

  if (layoutSections.includes('learning_areas')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(sectionFontSize);
    doc.text('Learning Areas', 14, y);
    y += 3;

    const colStrand = 40, colSub = 40, colMark = 22, colLevel = W - colStrand - colSub - colMark;

    const rowHeader = (ry) => {
      doc.setFillColor(230, 230, 230);
      doc.rect(M, ry, W, 7, 'F');
      cell(doc, 'Strand', M, ry, colStrand, 7, { bold: true, size: 7.5 });
      cell(doc, 'Sub-strand', M + colStrand, ry, colSub, 7, { bold: true, size: 7.5 });
      cell(doc, 'Mark', M + colStrand + colSub, ry, colMark, 7, { bold: true, size: 7.5 });
      cell(doc, 'Competency Level', M + colStrand + colSub + colMark, ry, colLevel, 7, { bold: true, size: 7.5 });
    };

    const levelLabel = (lvl) => {
      const map = { EE: 'E.E. - Exceeding Expectations', ME: 'M.E. - Meeting Expectations', AE: 'A.E. - Approaching Expectations', BE: 'B.E. - Below Expectations' };
      return (lvl && map[lvl]) ? `${lvl} - ${map[lvl]}` : '-';
    };

    const hasData = areas.some(a => (a.strands && a.strands.length) || (a.summative && a.summative.length));
    if (!hasData) {
      cell(doc, 'No assessment data available for this term.', M, y, W, 8, { size: 8 });
      y += 8;
    }

    areas.forEach((a) => {
      const strands = a.strands || [];
      const summative = a.summative || [];

      if (!strands.length && !summative.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(String(a.area_name || '').toUpperCase(), M, y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        y += 7;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(String(a.area_name || '').toUpperCase(), M, y + 5);
      y += 7;
      if (y > pageH - 40) { doc.addPage(); y = 16; }

      if (strands.length && strands.some(s => s.sub_strands && s.sub_strands.length)) {
        rowHeader(y);
        let ry = y + 7;
        strands.forEach((s, si) => {
          (s.sub_strands || []).forEach((sb) => {
            if (ry + 7 > pageH - 30) { doc.addPage(); ry = 16; rowHeader(ry); ry += 7; }
            cell(doc, si === 0 ? s.strand_name || '' : '', M, ry, colStrand, 7, { size: 7.5 });
            cell(doc, sb.sub_strand_name || '', M + colStrand, ry, colSub, 7, { size: 7.5 });
            cell(doc, sb.formative_score || '-', M + colStrand + colSub, ry, colMark, 7, { size: 7.5 });
            cell(doc, levelLabel(sb.performance_level), M + colStrand + colSub + colMark, ry, colLevel, 7, { size: 7 });
            ry += 7;
          });
        });

        if (summative.length) {
          if (ry + 8 > pageH - 30) { doc.addPage(); ry = 16; }
          cell(doc, 'Summative (CAT / End-Term)', M, ry, W, 6, { bold: true, size: 7.5 });
          ry += 6;
          summative.forEach((sm) => {
            if (ry + 7 > pageH - 30) { doc.addPage(); ry = 16; }
            cell(doc, `${sm.exam_type}: ${sm.exam_name || ''}`, M, ry, colStrand, 7, { size: 7.5 });
            cell(doc, sm.sub_area_name || '', M + colStrand, ry, colSub, 7, { size: 7.5 });
            cell(doc, sm.summative_score || '-', M + colStrand + colSub, ry, colMark, 7, { size: 7.5 });
            cell(doc, levelLabel(sm.performance_level), M + colStrand + colSub + colMark, ry, colLevel, 7, { size: 7 });
            ry += 7;
          });
        }
        y = ry + 5;
      } else if (summative.length) {
        summative.forEach((sm) => {
          if (y + 7 > pageH - 30) { doc.addPage(); y = 16; }
          cell(doc, `${sm.exam_type}: ${sm.exam_name || ''}`, M, y, colStrand, 7, { size: 7.5 });
          cell(doc, sm.sub_area_name || '', M + colStrand, y, colSub, 7, { size: 7.5 });
          cell(doc, sm.summative_score || '-', M + colStrand + colSub, y, colMark, 7, { size: 7.5 });
          cell(doc, levelLabel(sm.performance_level), M + colStrand + colSub + colMark, y, colLevel, 7, { size: 7 });
          y += 7;
        });
        y += 5;
      }

      if (y > pageH - 40) { doc.addPage(); y = 16; }
    });

    if (y > pageH - 70) { doc.addPage(); y = 18; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('KEY:', M, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('KEY:  E.E. = Exceeding Expectations    M.E. = Meeting Expectations    A.E. = Approaching Expectations    B.E. = Below Expectations', M, y + 4);
    y += 10;
  }

  doc.save(`${(childName || 'student').replace(/\s+/g, '-')}-academic-report-${term}.pdf`);
}
