import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { id: 'home', label: 'Home', icon: '🏠', route: '/home' },
  { id: 'attendance', label: 'Attendance', icon: '📋', route: '/teacher/attendance' },
  { id: 'exams', label: 'Assessments', icon: '📝', route: '/exams' },
  { id: 'reports', label: 'Reports', icon: '📊', route: '/class-report' },
  { id: 'more', label: 'More', icon: '☰', route: '/home' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(tab) {
    const path = location.pathname;
    if (tab.id === 'home') return path === '/home';
    if (tab.id === 'attendance') return path.includes('/attendance');
    if (tab.id === 'exams') return path.includes('/exams');
    if (tab.id === 'reports') return path.includes('/class-report') || path.includes('/competency') || path.includes('/exams/report');
    if (tab.id === 'more') return path === '/home' && !path.includes('/attendance') && !path.includes('/exams') && !path.includes('/class-report') && !path.includes('/competency');
    return false;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: '#fff',
      borderTop: '1px solid #E0E0E0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 999,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map(tab => {
        const active = isActive(tab);
        return (
          <button key={tab.id} onClick={() => navigate(tab.route)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              flex: 1,
              height: '100%',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              opacity: active ? 1 : 0.5,
              transition: 'opacity 0.2s',
            }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              color: active ? '#7B4F9B' : '#888',
            }}>{tab.label}</span>
            {active && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 3,
                backgroundColor: '#7B4F9B',
                borderRadius: '0 0 3px 3px',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
