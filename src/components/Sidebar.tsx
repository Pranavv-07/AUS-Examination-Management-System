import React from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  GraduationCap,
  Building,
  DoorOpen,
  LayoutGrid,
  Sparkles,
  ClipboardCheck,
  UserCheck2,
  FileSpreadsheet,
  FileText,
  Files,
  Archive,
  History,
  ShieldAlert,
  Settings,
  BarChart3,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (moduleKey: string) => void;
  currentUser: User;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: string;
  adminOnly?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  currentUser,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  const menuSections: MenuSection[] = [
    {
      title: 'EXAMINATION CORE',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'examinations', label: 'Examinations', icon: CalendarCheck },
        { key: 'timetable', label: 'Timetable Schedule', icon: CalendarDays },
        { key: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'ACADEMIC & FACULTY',
      items: [
        { key: 'students', label: 'Student Records', icon: GraduationCap },
        { key: 'faculty', label: 'Faculty Registry', icon: Users },
        { key: 'departments', label: 'Departments & Groups', icon: Building },
      ],
    },
    {
      title: 'ROOMS & INFRASTRUCTURE',
      items: [
        { key: 'rooms', label: 'Room Management', icon: DoorOpen },
        { key: 'layout_designer', label: 'Visual Layout Designer', icon: LayoutGrid, highlight: true },
      ],
    },
    {
      title: 'ALLOCATION & DUTIES',
      items: [
        { key: 'seating_generator', label: 'Seating Arrangement', icon: Sparkles, highlight: true },
        { key: 'faculty_availability', label: 'Faculty Availability', icon: ClipboardCheck },
        { key: 'invigilation_duties', label: 'Invigilation Duties', icon: UserCheck2 },
      ],
    },
    {
      title: 'OFFICIAL DOCUMENTS',
      items: [
        { key: 'attendance_sheets', label: 'Student Attendance Sheets', icon: FileSpreadsheet, badge: '5-Col' },
        { key: 'seating_plan_absentees', label: 'Seating Plan & Absentees', icon: FileText },
        { key: 'generated_documents', label: 'Generated Documents Hub', icon: Files },
      ],
    },
    {
      title: 'GOVERNANCE & SYSTEM',
      items: [
        { key: 'historical_exams', label: 'Historical Examinations', icon: Archive },
        { key: 'audit_logs', label: 'Audit Logs', icon: History, adminOnly: true },
        { key: 'user_management', label: 'User Management', icon: ShieldAlert, adminOnly: true },
        { key: 'settings', label: 'Portal Settings & DB', icon: Settings },
      ],
    },
  ];

  const handleItemClick = (key: string) => {
    onSelectModule(key);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0a192f] text-slate-200 flex-shrink-0 flex flex-col h-full border-r border-slate-800 select-none overflow-hidden transition-transform duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile drawer header */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-800 bg-[#002147] shrink-0">
          <span className="font-extrabold text-sm text-white font-heading">Examination Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable menu section with dedicated slim scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-4 sidebar-scroll min-h-0">
          {menuSections.map(section => {
            const visibleItems = section.items.filter(
              item => !item.adminOnly || isAdmin
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentModule === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleItemClick(item.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-[#EA580C] text-white shadow-sm font-bold'
                            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive
                                ? 'text-white'
                                : item.highlight
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                              isActive
                                ? 'bg-black/25 text-white'
                                : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.adminOnly && !item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                              isActive ? 'bg-black/25 text-white' : 'bg-purple-900/60 text-purple-300'
                            }`}
                          >
                            Admin
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="shrink-0 p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-[#071324]">
          <p className="font-bold text-slate-300">Aditya University Exam Portal</p>
          <p className="text-[10px]">Surampalem Campus • Autonomous</p>
        </div>
      </aside>
    </>
  );
};
