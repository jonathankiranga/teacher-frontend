function formatCurrency(value) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

// Draw a bordered, text-filled cell. Returns nothing — caller advances y.
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

// Draw a small colored level badge (filled rect + white text)
function levelBadge(doc, level, x, y, w) {
  const h = 5;
  const colors = {
    EE: { bg: [46, 125, 50],   text: [255, 255, 255] },
    ME: { bg: [21, 101, 192],  text: [255, 255, 255] },
    AE: { bg: [230, 81, 0],    text: [255, 255, 255] },
    BE: { bg: [198, 40, 40],   text: [255, 255, 255] }
  };
  const c = colors[level];
  if (!c) {
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('—', x + w / 2, y + 3.5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    return h;
  }
  doc.setFillColor(...c.bg);
  doc.rect(x + 1, y, w - 2, h, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...c.text);
  doc.text(String(level), x + w / 2, y + 3.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  return h;
}

// ─────────────────────────────────────────────────────────────────────────────
// KNEC CBC-compliant PDF export
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadAcademicPdf(report, childName, phone, term) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const M = 14; // margin
  const W = pageW - M * 2;

  const student    = report?.student    || {};
  const school     = report?.school     || report?.school_contact || {};
  const learningAreas = report?.learning_areas || [];
  const attendance = report?.attendance || {};
  const settings   = report?.report_settings || {};
  const nextTerm   = report?.next_term_start || null;
  const reportTerm = report?.term || term || '';
  const reportYear = report?.year || new Date().getFullYear();

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return String(d).split('T')[0]; }
  };

  doc.setDrawColor(60, 60, 60);
  let y = M;

  // ── Seal placeholder circle (left) ──
  doc.setDrawColor(160, 120, 200);
  doc.setLineWidth(0.5);
  doc.circle(M + 10, y + 10, 9);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 120, 200);
  doc.text('SEAL', M + 10, y + 10.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.2);

  // ── School name (centered) ──
  const schoolName = school.school_name || 'SCHOOL NAME';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(schoolName.toUpperCase(), pageW / 2, y + 6, { align: 'center' });

  // School address / phone / county
  const schoolMeta = [school.contact_address, school.contact_phone, school.region].filter(Boolean).join(' | ');
  if (schoolMeta) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(schoolMeta, pageW / 2, y + 12, { align: 'center' });
  }

  // Divider
  y += 16;
  doc.setDrawColor(123, 79, 155);
  doc.setLineWidth(0.8);
  doc.line(M, y, pageW - M, y);
  doc.setLineWidth(0.2);
  doc.setDrawColor(60, 60, 60);
  y += 4;

  // CBC report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(123, 79, 155);
  doc.text('COMPETENCY-BASED CURRICULUM (CBC) PROGRESS REPORT', pageW / 2, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Academic Year: ${reportYear}    |    ${reportTerm}`, pageW / 2, y, { align: 'center' });
  y += 8;

  // ── Student details (2-column table) ──
  const detailRows = [
    ['Name', student.full_name || '—',            'Admission No', student.admission_number || '—'],
    ['Class', student.class_name || '—',           'Gender',        student.gender || '—'],
    ['Date of Birth', formatDate(student.date_of_birth), 'Guardian', student.guardian_name || '—'],
    ['Guardian Phone', student.guardian_phone || '—', 'Student ID', String(student.student_id || '—')]
  ];
  const dColW = W / 4;
  const dRowH = 7;
  doc.setFillColor(243, 232, 255);
  doc.rect(M, y, W, dRowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('STUDENT DETAILS', M + 2, y + 4.5);
  y += dRowH;
  detailRows.forEach(([l1, v1, l2, v2]) => {
    doc.setFillColor(250, 248, 255);
    doc.rect(M, y, W, dRowH, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(100, 80, 120);
    doc.text(String(l1), M + 1.5, y + 4.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 30, 30);
    doc.text(String(v1), M + dColW + 1.5, y + 4.5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(100, 80, 120);
    doc.text(String(l2), M + dColW * 2 + 1.5, y + 4.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 30, 30);
    doc.text(String(v2), M + dColW * 3 + 1.5, y + 4.5);
    doc.rect(M, y, dColW, dRowH);
    doc.rect(M + dColW, y, dColW, dRowH);
    doc.rect(M + dColW * 2, y, dColW, dRowH);
    doc.rect(M + dColW * 3, y, dColW, dRowH);
    y += dRowH;
  });
  doc.setTextColor(0, 0, 0);
  y += 5;

  // ── Per learning area grids ──
  const colSubArea = 48;
  const cellH = 14; // row height: score line + badge line
  const headerH = 7;

  for (const area of learningAreas) {
    const sessions = area.sessions || [];
    const subAreas = area.sub_areas || [];
    if (subAreas.length === 0) continue;

    const numSessCols = sessions.length;
    const overallColW = 18;
    const sessColW = numSessCols > 0 ? (W - colSubArea - overallColW) / numSessCols : W - colSubArea - overallColW;

    const neededH = headerH * 2 + cellH + 18;
    if (y + neededH > pageH - M) { doc.addPage(); y = M; }

    // Area header bar
    doc.setFillColor(123, 79, 155);
    doc.rect(M, y, W, headerH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(String(area.area_name).toUpperCase(), M + 2, y + 4.8);
    if (area.overall_level) {
      doc.setFontSize(7.5);
      doc.text(`Overall: ${area.overall_level}`, pageW - M - 2, y + 4.8, { align: 'right' });
    }
    doc.setTextColor(0, 0, 0);
    y += headerH;

    // Column headers
    doc.setFillColor(237, 217, 255);
    doc.rect(M, y, W, headerH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(60, 40, 80);
    cell(doc, 'Sub-strand', M, y, colSubArea, headerH, { bold: true, size: 7 });
    sessions.forEach((sess, i) => {
      const label = sess.exam_name || sess.exam_type || `Session ${i + 1}`;
      cell(doc, label, M + colSubArea + i * sessColW, y, sessColW, headerH, { bold: true, size: 6.5 });
    });
    doc.setFillColor(221, 194, 255);
    doc.rect(M + colSubArea + numSessCols * sessColW, y, overallColW, headerH, 'F');
    cell(doc, 'Overall', M + colSubArea + numSessCols * sessColW, y, overallColW, headerH, { bold: true, size: 7 });
    doc.setTextColor(0, 0, 0);
    y += headerH;

    // Sub-area rows
    subAreas.forEach((sa, idx) => {
      if (y + cellH > pageH - M) {
        doc.addPage(); y = M;
        doc.setFillColor(237, 217, 255);
        doc.rect(M, y, W, headerH, 'F');
        doc.setFont('helvetica', 'bold');
        cell(doc, 'Sub-strand', M, y, colSubArea, headerH, { bold: true, size: 7 });
        sessions.forEach((sess, i) => {
          cell(doc, sess.exam_name || sess.exam_type || '', M + colSubArea + i * sessColW, y, sessColW, headerH, { bold: true, size: 6.5 });
        });
        doc.setFillColor(221, 194, 255);
        doc.rect(M + colSubArea + numSessCols * sessColW, y, overallColW, headerH, 'F');
        cell(doc, 'Overall', M + colSubArea + numSessCols * sessColW, y, overallColW, headerH, { bold: true, size: 7 });
        y += headerH;
      }

      if (idx % 2 === 0) { doc.setFillColor(255, 252, 255); } else { doc.setFillColor(252, 248, 255); }
      doc.rect(M, y, W, cellH, 'F');
      cell(doc, sa.sub_strand_name || '', M, y, colSubArea, cellH, { size: 7.5 });

      sessions.forEach((sess, i) => {
        const cx = M + colSubArea + i * sessColW;
        const r = sa.results && sa.results[sess.session_id];
        const scoreText = r && r.score != null && r.out_of != null
          ? `${r.score}/${r.out_of}` : '—';
        doc.rect(cx, y, sessColW, cellH);
        doc.setFont('helvetica', r ? 'bold' : 'normal');
        doc.setFontSize(7);
        doc.setTextColor(r ? 40 : 180, r ? 40 : 180, r ? 40 : 180);
        doc.text(scoreText, cx + sessColW / 2, y + 5, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        if (r && r.performance_level) {
          levelBadge(doc, r.performance_level, cx + 1, y + 7.5, sessColW - 2);
        }
      });

      const ocx = M + colSubArea + numSessCols * sessColW;
      doc.setFillColor(248, 242, 255);
      doc.rect(ocx, y, overallColW, cellH, 'F');
      doc.rect(ocx, y, overallColW, cellH);
      if (sa.overall_level) {
        levelBadge(doc, sa.overall_level, ocx + 1, y + (cellH - 5) / 2, overallColW - 2);
      } else {
        doc.setFontSize(7); doc.setTextColor(180, 180, 180);
        doc.text('—', ocx + overallColW / 2, y + cellH / 2 + 1, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
      y += cellH;
    });

    // Teacher remarks
    if (y + 8 > pageH - M) { doc.addPage(); y = M; }
    doc.setFillColor(250, 250, 250);
    doc.rect(M, y, W, 8, 'F');
    doc.rect(M, y, W, 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Teacher Remarks:', M + 2, y + 5);
    const remarksText = area.remarks || '_____________________________________________________________________';
    doc.setTextColor(40, 40, 40);
    doc.text(remarksText, M + 32, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 8;
    y += 4;
  }

  // ── Attendance ──
  if (y + 14 > pageH - M) { doc.addPage(); y = M; }
  doc.setFillColor(227, 242, 253);
  doc.rect(M, y, W, 10, 'F');
  doc.rect(M, y, W, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ATTENDANCE', M + 2, y + 6.5);
  const attW = (W - 40) / 3;
  const attData = [
    ['Days Present', String(attendance.present || 0)],
    ['Days Absent',  String(attendance.absent  || 0)],
    ['Total Days',   String(attendance.total   || '—')]
  ];
  attData.forEach(([label, val], i) => {
    const ax = M + 40 + i * attW;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
    doc.text(label + ':', ax, y + 6.5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(0, 0, 0);
    doc.text(val, ax + 22, y + 6.5);
  });
  doc.setTextColor(0, 0, 0);
  y += 14;

  // ── Signatures ──
  if (y + 36 > pageH - M) { doc.addPage(); y = M; }
  const halfW = W / 2 - 4;
  // Class teacher
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text('Class Teacher', M, y + 4);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  const teacherName = settings.teacher_name || '';
  doc.text(`Name: ${teacherName}`, M, y + 10);
  doc.line(M + 12, y + 10, M + halfW, y + 10);
  doc.text('Signature:', M, y + 17);
  doc.line(M + 16, y + 17, M + halfW, y + 17);
  doc.text('Date:', M, y + 24);
  doc.line(M + 10, y + 24, M + halfW, y + 24);

  // HT / Principal
  const htX = M + halfW + 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text('HT / Principal', htX, y + 4);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  const htName = school.contact_name || '';
  doc.text(`Name: ${htName}`, htX, y + 10);
  doc.line(htX + 12, y + 10, htX + halfW, y + 10);
  doc.text('Signature:', htX, y + 17);
  doc.line(htX + 16, y + 17, htX + halfW, y + 17);

  // School stamp box
  doc.setDrawColor(160, 120, 200);
  doc.rect(htX, y + 18, halfW, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(160, 120, 200);
  doc.text('School Stamp / Seal', htX + halfW / 2, y + 26, { align: 'center' });
  doc.setDrawColor(60, 60, 60);
  doc.setTextColor(0, 0, 0);
  y += 36;

  // ── Next term ──
  if (nextTerm) {
    if (y + 8 > pageH - M) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text(`Next Term Opens: ${formatDate(nextTerm)}`, M, y);
    y += 8;
  }

  // ── Competency key ──
  if (y + 10 > pageH - M) { doc.addPage(); y = M; }
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, W, 9, 'F');
  doc.rect(M, y, W, 9);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(60, 60, 60);
  doc.text('KEY:', M + 2, y + 5.5);
  const keyItems = [
    { code: 'EE', label: 'Exceeding Expectations' },
    { code: 'ME', label: 'Meeting Expectations' },
    { code: 'AE', label: 'Approaching Expectations' },
    { code: 'BE', label: 'Below Expectations' }
  ];
  let kx = M + 14;
  keyItems.forEach(({ code, label }) => {
    levelBadge(doc, code, kx, y + 2, 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(60, 60, 60);
    doc.text(`= ${label}`, kx + 9, y + 5.5);
    kx += 10 + doc.getTextWidth(`= ${label}`) + 4;
  });
  doc.setTextColor(0, 0, 0);

  doc.save(`${(childName || student.full_name || 'student').replace(/\s+/g, '-')}-CBC-report-${reportTerm.replace(/\s+/g, '-')}-${reportYear}.pdf`);
}
