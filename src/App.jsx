import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherLogin from './pages/TeacherLogin.jsx';
import HomePage from './pages/HomePage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import ExamsPage from './pages/ExamsPage.jsx';
import ReportCardPage from './pages/ReportCardPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';

export default function App() {
  return (
    <>
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Navigate to="/teacher/login" replace />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/teacher/attendance" element={<AttendancePage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/report/:studentId" element={<ReportCardPage />} />
        <Route path="/exams/report/:studentId/:term" element={<ReportCardPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </>
  );
}
