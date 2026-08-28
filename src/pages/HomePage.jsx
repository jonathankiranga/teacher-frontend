import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PushManager from '../components/PushManager.jsx';

const modules = [
  { id: 'attendance', label: 'Attendance', icon: '📋', desc: 'Mark and track daily student attendance', color: '#7B4F9B', route: '/teacher/attendance' },
  { id: 'exams', label: 'Exams', icon: '📝', desc: 'Create assessments and record scores', color: '#2E7D32', route: '/exams' },
  { id: 'reports', label: 'Reports', icon: '📊', desc: 'Generate student report cards', color: '#D97706', route: '/exams/report' },
  { id: 'lesson-plans', label: 'Lesson Plans', icon: '📖', desc: 'Plan and organize your lessons', color: '#E65100', route: '/lesson-plans' },
  { id: 'class-report', label: 'Class Report', icon: '📑', desc: 'View class performance summaries', color: '#00695C', route: '/class-report' },
  { id: 'competency-ratings', label: 'Competency', icon: '⭐', desc: 'Rate core competencies and values', color: '#7B4F9B', route: '/competency-ratings' },
  { id: 'help', label: 'Help & Support', icon: '❓', desc: 'Get help and contact support', color: '#6B7280', route: '/help' },
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
    <div style={{ backgroundColor: '#F0F2F5', minHeight: '100vh', paddingBottom: 70 }}>
      <PushManager teacherId={teacherId} />

      {/* Profile Header */}
      <div style={{
        backgroundColor: '#7B4F9B',
        padding: '24px 20px 20px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 'bold',
            }}>E</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Teacher Dashboard</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Welcome back</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none', color: '#fff', padding: '6px 14px',
              borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Logout</button>
        </div>
      </div>

      {/* Tools Grid */}
      <div style={{ maxWidth: 680, margin: '16px auto 0', padding: '0 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10, paddingLeft: 4 }}>Tools</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {modules.map(m => (
            <button key={m.id} onClick={() => navigate(m.route)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 12px',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = ''; }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{m.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
