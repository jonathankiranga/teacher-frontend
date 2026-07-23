import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HelpPage() {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh' }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Help & Guide</h1>
          <div style={{ width: 60 }} />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        <div className="card p-5">
          <h2 className="text-base font-bold mb-4" style={{ color: '#7B4F9B' }}>Getting Started</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#666' }}>Education APP is a free school management system by Smarternow Data Venture. Teachers take attendance and record scores. Parents track their children.</p>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold mb-4" style={{ color: '#7B4F9B' }}>Roll Call (Attendance)</h2>
          <div className="space-y-3">
            <p className="text-sm" style={{ color: '#333' }}><b>1.</b> Tap <b>Attendance</b> from the home screen.</p>
            <p className="text-sm" style={{ color: '#333' }}><b>2.</b> Select the <b>date</b> (defaults to today).</p>
            <p className="text-sm" style={{ color: '#333' }}><b>3.</b> For each student, tap: ✓ Present | ✗ Absent | ⏰ Late | ? Excused</p>
            <p className="text-sm" style={{ color: '#333' }}><b>4.</b> Tap <b>Sync</b> to save. Works offline!</p>
            <p className="text-sm" style={{ color: '#888' }}>When you mark a student Absent, premium parents receive a WhatsApp alert automatically.</p>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold mb-4" style={{ color: '#7B4F9B' }}>Exam Scores</h2>
          <div className="space-y-3">
            <p className="text-sm" style={{ color: '#333' }}><b>1.</b> Tap <b>Exams</b> from the home screen.</p>
            <p className="text-sm" style={{ color: '#333' }}><b>2.</b> Select: <b>Class → Learning Area → Strand → Sub-strand</b></p>
            <p className="text-sm" style={{ color: '#333' }}><b>3.</b> Type an assessment name and tap <b>Create</b> (or select an existing one).</p>
            <p className="text-sm" style={{ color: '#333' }}><b>4.</b> Enter each student's score <b>out of 100</b>. The level auto-computes.</p>
            <p className="text-sm" style={{ color: '#333' }}><b>5.</b> Tap <b>Save All</b>. Premium parents get results on WhatsApp.</p>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold mb-4" style={{ color: '#7B4F9B' }}>Performance Levels</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}><p className="text-sm font-bold" style={{ color: '#2E7D32' }}>EE</p><p className="text-xs" style={{ color: '#555' }}>80%+ — Exceeding Expectations</p></div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#E3F2FD' }}><p className="text-sm font-bold" style={{ color: '#1565C0' }}>ME</p><p className="text-xs" style={{ color: '#555' }}>60-79% — Meeting Expectations</p></div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFF3E0' }}><p className="text-sm font-bold" style={{ color: '#E65100' }}>AE</p><p className="text-xs" style={{ color: '#555' }}>40-59% — Approaching Expectations</p></div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFEBEE' }}><p className="text-sm font-bold" style={{ color: '#C62828' }}>BE</p><p className="text-xs" style={{ color: '#555' }}>Below 40% — Below Expectations</p></div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold mb-4" style={{ color: '#7B4F9B' }}>Report Cards</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#666' }}>Tap <b>Reports</b>, select a student and term. A printable CBC progress report shows performance per learning area plus attendance summary.</p>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold mb-4" style={{ color: '#7B4F9B' }}>Quick Tips</h2>
          <div className="space-y-2 text-sm" style={{ color: '#666' }}>
            <p>• Works offline — data syncs when internet is available</p>
            <p>• OTPs sent via WhatsApp — keep your number registered</p>
            <p>• Kenyan terms: Term 1 (Jan-Apr), Term 2 (May-Aug), Term 3 (Sep-Nov)</p>
            <p>• The app is free for schools. Parents can subscribe to premium WhatsApp alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
