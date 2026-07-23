export function downloadCSV(rows, filename = 'attendance.csv') {
  const header = 'student_id,date,status,teacher_id';
  const lines = rows.map(r => `${r.student_id},${r.date},${r.status},${r.teacher_id}`);
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
