import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PushManager from '../components/PushManager.jsx';

const modules = [
  { id: 'attendance', label: 'Attendance', icon: '📋', color: '#7B4F9B', route: '/teacher/attendance' },
  { id: 'exams', label: 'Exams', icon: '📝', color: '#2E7D32', route: '/exams' },
  { id: 'reports', label: 'Reports', icon: '📊', color: '#D97706', route: '/exams/report' },
  { id: 'help', label: 'Help', icon: '❓', color: '#6B7280', route: '/help' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  function handleLogout() {
    sessionStorage.clear();
    navigate('/teacher/login', { replace: true });
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh' }}>
      <PushManager teacherId={teacherId} />
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6"
           style={{ height: 56, backgroundColor: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#7B4F9B' }}>E</div>
          <span className="font-bold text-sm" style={{ color: '#333' }}>Education APP</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#888' }}>Teacher</span>
          <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Logout</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Teacher Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Select a module to get started</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
          {modules.map((m) => (
            <button key={m.id} onClick={() => navigate(m.route)}
              className="flex flex-col items-center justify-center rounded-2xl text-white transition-all duration-200 cursor-pointer"
              style={{ backgroundColor: m.color, minHeight: 120, padding: '20px 12px 16px' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <span className="text-3xl mb-2">{m.icon}</span>
              <span className="text-sm font-semibold text-center leading-tight">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center py-4 text-xs" style={{ color: '#94a3b8', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
        Education APP v1.0 — powered by Smarternow Data Venture
      </div>
    </div>
  );
}
