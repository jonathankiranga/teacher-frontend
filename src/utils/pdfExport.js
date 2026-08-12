function formatCurrency(value) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

export async function downloadAcademicPdf(report, childName, phone, term) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
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
    y += 8;

    if (areas.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('No assessment data available for this term.', 14, y);
    } else {
      areas.forEach((area) => {
        if (y > 260) {
          doc.addPage();
          y = 18;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(bodyFontSize);
        doc.text(`${area.area_name}`, 14, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Average: ${area.avg_pct || 0}%`, 18, y);
        y += 6;
        y = addWrappedText(doc, `Summary: ${area.strand_summary || 'No strand summary available'}`, 18, y, 170, 5);
        y += 4;
      });
    }
  }

  doc.save(`${(childName || 'student').replace(/\s+/g, '-')}-academic-report-${term}.pdf`);
}
