import React, { useState } from 'react';
import { db } from './services/dbStorage';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { CookieBanner } from './components/CookieBanner';
import { TermsAndConditionsModal } from './components/TermsAndConditionsModal';

// Module pages
import { Dashboard } from './pages/Dashboard';
import { ExaminationManagement } from './pages/ExaminationManagement';
import { TimetableManagement } from './pages/TimetableManagement';
import { AnalyticsReporting } from './pages/AnalyticsReporting';
import { StudentManagement } from './pages/StudentManagement';
import { FacultyManagement } from './pages/FacultyManagement';
import { DepartmentManagement } from './pages/DepartmentManagement';
import { RoomManagement } from './pages/RoomManagement';
import { RoomLayoutDesigner } from './pages/RoomLayoutDesigner';
import { SeatingArrangement } from './pages/SeatingArrangement';
import { FacultyAvailability } from './pages/FacultyAvailability';
import { InvigilationDuties } from './pages/InvigilationDuties';
import { StudentAttendanceSheet } from './pages/StudentAttendanceSheet';
import { SeatingPlanAbsentees } from './pages/SeatingPlanAbsentees';
import { GeneratedDocuments } from './pages/GeneratedDocuments';
import { HistoricalExaminations } from './pages/HistoricalExaminations';
import { AuditLogs } from './pages/AuditLogs';
import { UserManagement } from './pages/UserManagement';
import { PortalSettings } from './pages/PortalSettings';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Start on Login page by default as requested
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // If not logged in, render the redesigned Login page
  if (!currentUser) {
    return (
      <>
        <Login
          onLoginSuccess={user => setCurrentUser(user)}
          onOpenTerms={() => setIsTermsOpen(true)}
        />
        <CookieBanner onOpenTerms={() => setIsTermsOpen(true)} />
        <TermsAndConditionsModal
          isOpen={isTermsOpen}
          onClose={() => setIsTermsOpen(false)}
        />
      </>
    );
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavigate={setActiveModule} />;
      case 'examinations':
        return <ExaminationManagement />;
      case 'timetable':
        return <TimetableManagement />;
      case 'analytics':
        return <AnalyticsReporting />;
      case 'students':
        return <StudentManagement />;
      case 'faculty':
        return <FacultyManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'rooms':
        return <RoomManagement onNavigate={setActiveModule} />;
      case 'layout_designer':
        return <RoomLayoutDesigner />;
      case 'seating_generator':
        return <SeatingArrangement />;
      case 'faculty_availability':
        return <FacultyAvailability />;
      case 'invigilation_duties':
        return <InvigilationDuties />;
      case 'attendance_sheets':
        return <StudentAttendanceSheet />;
      case 'seating_plan_absentees':
        return <SeatingPlanAbsentees />;
      case 'generated_documents':
        return <GeneratedDocuments />;
      case 'historical_exams':
        return <HistoricalExaminations />;
      case 'audit_logs':
        return <AuditLogs />;
      case 'user_management':
        return <UserManagement />;
      case 'settings':
        return <PortalSettings />;
      default:
        return <NotFoundPage onReturnHome={() => setActiveModule('dashboard')} />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col antialiased text-slate-800">
      <Navbar
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        activeModule={activeModule}
        onNavigate={setActiveModule}
        onLogout={() => setCurrentUser(null)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <Sidebar
          currentModule={activeModule}
          onSelectModule={setActiveModule}
          currentUser={currentUser}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderModule()}</div>
        </main>
      </div>

      {/* Global Modals & Cookie Banner */}
      <CookieBanner onOpenTerms={() => setIsTermsOpen(true)} />
      <TermsAndConditionsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  );
}
