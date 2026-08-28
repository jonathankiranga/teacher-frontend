import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TeacherLogin from './pages/TeacherLogin.jsx';
import HomePage from './pages/HomePage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import ExamsPage from './pages/ExamsPage.jsx';
import ReportCardPage from './pages/ReportCardPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import LessonPlansPage from './pages/LessonPlansPage.jsx';
import ClassReportPage from './pages/ClassReportPage.jsx';
import CompetencyRatingsPage from './pages/CompetencyRatingsPage.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import BottomNav from './components/BottomNav.jsx';

function AppLayout() {
  const location = useLocation();
  const hideNav = location.pathname === '/' || location.pathname.includes('/login');
  return (
    <>
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Navigate to="/teacher/login" replace />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/teacher/attendance" element={<AttendancePage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/report" element={<ReportCardPage />} />
        <Route path="/exams/report/:studentId" element={<ReportCardPage />} />
        <Route path="/exams/report/:studentId/:term" element={<ReportCardPage />} />
        <Route path="/lesson-plans" element={<LessonPlansPage />} />
        <Route path="/class-report" element={<ClassReportPage />} />
        <Route path="/class-report/:classId" element={<ClassReportPage />} />
        <Route path="/class-report/:classId/:term" element={<ClassReportPage />} />
        <Route path="/competency-ratings" element={<CompetencyRatingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return <AppLayout />;
}
