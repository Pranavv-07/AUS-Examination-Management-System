import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { Examination, ExamSession, SubjectSlot } from '../types';
import { Modal } from '../components/Modal';
import {
  CalendarCheck,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const ExaminationManagement: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>(db.getExaminations());
  const [feedback, setFeedback] = useState('');

  // Exam Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formYear, setFormYear] = useState('2026-2027');
  const [formRegulation, setFormRegulation] = useState('AR23 / AR20');
  const [formStartDate, setFormStartDate] = useState('2026-10-20');
  const [formEndDate, setFormEndDate] = useState('2026-10-31');

  // Session Add Modal
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [targetExamId, setTargetExamId] = useState('');
  const [sessionDate, setSessionDate] = useState('2026-10-24');
  const [sessionShift, setSessionShift] = useState<'FN' | 'AN'>('FN');

  const handleOpenAddExam = () => {
    setEditingExam(null);
    setFormCode(`AU-EXAM-${Date.now().toString().slice(-4)}`);
    setFormTitle('B.Tech End Semester Regular Examinations');
    setFormYear('2026-2027');
    setFormRegulation('AR23 / AR20');
    setFormStartDate('2026-10-20');
    setFormEndDate('2026-10-31');
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    const examToSave: Examination = {
      id: editingExam ? editingExam.id : `exam_${Date.now()}`,
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim(),
      academicYear: formYear,
      semesterPattern: '3 & 5',
      examType: 'End Semester Regular',
      department: 'All Engineering Departments',
      regulation: formRegulation,
      startDate: formStartDate,
      endDate: formEndDate,
      status: editingExam?.status || 'DRAFT',
      sessions: editingExam?.sessions || [],
      availableRoomIds: ['rm_rtb_201', 'rm_rtb_202', 'rm_rtb_203', 'rm_jwb_101'],
      createdAt: editingExam?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: db.getCurrentUser().username,
    };

    db.saveExamination(examToSave);
    setExams(db.getExaminations());
    setIsExamModalOpen(false);
    setFeedback(`Examination ${examToSave.code} saved.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const targetExam = exams.find(ex => ex.id === targetExamId);
    if (!targetExam) return;

    const newSession: ExamSession = {
      id: `sess_${Date.now()}`,
      examinationId: targetExam.id,
      date: sessionDate,
      shift: sessionShift,
      startTime: sessionShift === 'FN' ? '09:30 AM' : '01:30 PM',
      endTime: sessionShift === 'FN' ? '12:30 PM' : '04:30 PM',
      status: 'SCHEDULED',
      subjects: [
        {
          id: `sb_${Date.now()}_1`,
          subjectCode: '23CS303',
          subjectName: 'Computer Organization & Architecture',
          branch: 'CSE',
          academicYear: '2',
          semester: '3',
          regulation: 'AR23',
          timetableCategory: 'T1',
          eligibleStudentCount: 48,
        },
        {
          id: `sb_${Date.now()}_2`,
          subjectCode: '22CS503',
          subjectName: 'Software Engineering & Agile Methodologies',
          branch: 'CSE',
          academicYear: '3',
          semester: '5',
          regulation: 'AR20',
          timetableCategory: 'T3',
          eligibleStudentCount: 48,
        },
      ],
    };

    targetExam.sessions.push(newSession);
    db.saveExamination(targetExam);
    setExams([...db.getExaminations()]);
    setIsSessionModalOpen(false);
    setFeedback(`Added session ${newSession.date} (${newSession.shift}) to ${targetExam.code}`);
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#EA580C]" />
              Examination Management
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              SEMESTER EXAMS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure examination notifications, academic regulations, multi-day exam sessions, and subjects.
          </p>
        </div>

        <button
          onClick={handleOpenAddExam}
          className="px-3.5 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Examination
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Examinations List */}
      <div className="space-y-4">
        {exams.map(exam => (
          <div key={exam.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] px-2 py-0.5 rounded">
                    {exam.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Reg: {exam.regulation} • AY: {exam.academicYear}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#002147] font-heading mt-1">{exam.title}</h3>
                <p className="text-xs text-slate-500">
                  Dates: {exam.startDate} to {exam.endDate} • Status: <strong className="text-emerald-700">{exam.status}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTargetExamId(exam.id);
                    setIsSessionModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Session
                </button>
              </div>
            </div>

            {/* Sessions list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Scheduled Examination Sessions ({exam.sessions.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exam.sessions.map((sess, idx) => (
                  <div
                    key={sess.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#002147] text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{sess.date}</span>
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                          {sess.shift} ({sess.startTime} - {sess.endTime})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {sess.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {sess.subjects.map(sb => (
                        <div
                          key={sb.id}
                          className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-slate-100"
                        >
                          <span className="font-bold text-slate-800">
                            {sb.subjectCode} — {sb.subjectName}
                          </span>
                          <span className="text-slate-500">
                            {sb.branch} (Sem {sb.semester}) [{sb.timetableCategory || 'T1'}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Exam Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Create New Examination"
        subtitle="Set up an examination series for Aditya University."
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Exam Code *</label>
              <input
                type="text"
                required
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={formYear}
                onChange={e => setFormYear(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Examination Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Regulation</label>
              <input
                type="text"
                value={formRegulation}
                onChange={e => setFormRegulation(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formStartDate}
                onChange={e => setFormStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={formEndDate}
                onChange={e => setFormEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Save Examination
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title="Add Examination Session Date & Shift"
        subtitle="Configure shift timings and eligible subject slots."
      >
        <form onSubmit={handleAddSession} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Exam *</label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Session Shift *</label>
              <select
                value={sessionShift}
                onChange={e => setSessionShift(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              >
                <option value="FN">FN: Forenoon (09:30 AM – 12:30 PM)</option>
                <option value="AN">AN: Afternoon (01:30 PM – 04:30 PM)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Add Session to Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
