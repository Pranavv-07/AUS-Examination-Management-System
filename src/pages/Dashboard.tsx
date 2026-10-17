import React from 'react';
import { db } from '../services/dbStorage';
import { User } from '../types';
import {
  GraduationCap,
  Users,
  DoorOpen,
  CalendarCheck,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  onNavigate: (module: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate }) => {
  const students = db.getStudents();
  const faculty = db.getFaculty();
  const rooms = db.getRooms();
  const exams = db.getExaminations();
  const seatings = db.getSeatingArrangements();
  const auditLogs = db.getAuditLogs().slice(0, 6);
  const activeExam = exams[0];

  const totalUsableCapacity = rooms.reduce((acc, r) => acc + (r.isActive ? r.usableCapacity : 0), 0);
  const activeStudents = students.filter(s => s.status === 'ACTIVE').length;
  const activeFaculty = faculty.filter(f => f.isActive).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Clear CTA */}
      <div className="bg-[#002147] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border-b-4 border-[#EA580C]">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs tracking-wider uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            Office of the Controller of Examinations • Surampalem
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white">
            Examination Operations Command Center
          </h1>

          <p className="text-slate-200 text-sm leading-relaxed max-w-2xl">
            Automated seat planning with bench-level 3rd and 5th semester mixing,
            official 5-column attendance sheets, and conflict-free invigilation rosters.
          </p>

          {/* Primary Clear Call to Action (Item 20) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('seating_generator')}
              className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#c2410c] active:bg-[#9a3412] text-white rounded-lg text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer focus:ring-4 focus:ring-orange-400"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Seating Plan</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('attendance_sheets')}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 border border-white/30 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Print Attendance Registers</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('layout_designer')}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 border border-white/30 cursor-pointer"
            >
              <DoorOpen className="w-4 h-4 text-amber-300" />
              <span>Visual Room Designer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Live Database Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-blue-400 transition">
          <div className="flex items-center justify-between text-slate-600 mb-2 font-semibold text-xs">
            <span>Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#002147] font-heading">{activeStudents}</div>
          <p className="text-[11px] text-slate-600 mt-1">
            Registered in database
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition">
          <div className="flex items-center justify-between text-slate-600 mb-2 font-semibold text-xs">
            <span>Faculty Roster</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#002147] font-heading">{activeFaculty}</div>
          <p className="text-[11px] text-slate-600 mt-1">
            Across engineering departments
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-emerald-400 transition">
          <div className="flex items-center justify-between text-slate-600 mb-2 font-semibold text-xs">
            <span>Usable Hall Capacity</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#002147] font-heading">{totalUsableCapacity}</div>
          <p className="text-[11px] text-slate-600 mt-1">
            Across {rooms.length} configured halls
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-purple-400 transition">
          <div className="flex items-center justify-between text-slate-600 mb-2 font-semibold text-xs">
            <span>Finalized Seating</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#002147] font-heading">{seatings.length}</div>
          <p className="text-[11px] text-slate-600 mt-1">
            Active session allocations
          </p>
        </div>
      </div>

      {/* Active Examination Spotlight or Clean Empty State */}
      {activeExam ? (
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
                  ACTIVE EXAMINATION
                </span>
                <span className="text-xs font-bold text-slate-600">{activeExam.code}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#002147] font-heading mt-1">
                {activeExam.title}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Academic Year {activeExam.academicYear} • Regulation {activeExam.regulation} • Date Range: {activeExam.startDate} to {activeExam.endDate}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 transition cursor-pointer"
              >
                View Timetable
              </button>
              <button
                type="button"
                onClick={() => onNavigate('seating_generator')}
                className="px-4 py-2 rounded-lg bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold transition cursor-pointer"
              >
                Manage Seating
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {activeExam.sessions.map((sess, idx) => (
              <div
                key={sess.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Session {idx + 1}: {sess.date}
                    </span>
                    <span className="bg-blue-100 text-blue-900 text-[10px] font-extrabold px-2 py-0.5 rounded">
                      {sess.shift} ({sess.startTime} - {sess.endTime})
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {sess.status}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {sess.subjects.map(s => (
                    <div
                      key={s.id}
                      className="text-xs flex items-center justify-between text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200"
                    >
                      <span className="font-bold text-slate-900">
                        {s.subjectCode} — {s.subjectName}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        {s.branch} (Sem {s.semester})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#002147]">No Active Examination Scheduled</h3>
            <p className="text-xs text-slate-500">
              Database is currently blank. Schedule semester end examinations and configure date sessions to begin automated seating and invigilation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('examinations')}
            className="px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Examination</span>
          </button>
        </div>
      )}

      {/* Two Column Section: Pipeline Steps + Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Examination Pipeline Workflow
            </h3>
            <span className="text-xs font-semibold text-slate-500">Step-by-Step Operations</span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                step: 1,
                title: 'Room Layout & 3-Seat Bench Configuration',
                desc: 'Configure 3-seats per bench with 3rd & 5th sem mixing pattern (3-5-3 or 5-3-5).',
                action: 'layout_designer',
                btnText: 'Edit Layouts',
              },
              {
                step: 2,
                title: 'Deterministic Seating Allocation Engine',
                desc: 'Auto-allocate students respecting eligibility, timetable groups T1-T4, and room capacities.',
                action: 'seating_generator',
                btnText: 'Generate Seating',
              },
              {
                step: 3,
                title: 'Collect Faculty Availability & Assign Duties',
                desc: 'Roster confirmed available faculty and generate balanced invigilation duties without conflicts.',
                action: 'invigilation_duties',
                btnText: 'Assign Invigilators',
              },
              {
                step: 4,
                title: 'Generate Mandatory 5-Column Attendance Sheets',
                desc: 'Official register with S.No, Roll Number, Student Name, Answer Booklet No, and Student Signature.',
                action: 'attendance_sheets',
                btnText: 'Print Registers',
              },
            ].map(item => (
              <div
                key={item.step}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#002147] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-snug">{item.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(item.action)}
                  className="self-end sm:self-auto px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition flex items-center gap-1 cursor-pointer flex-shrink-0 border border-blue-200"
                >
                  <span>{item.btnText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Audit Log Feed */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              Recent Audit Log
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('audit_logs')}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-slate-500 text-[10px] mb-0.5">
                  <span className="font-bold text-slate-700">{log.module}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-900 font-semibold line-clamp-2 leading-snug">{log.details}</p>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>By {log.actor.username} ({log.actor.role})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
