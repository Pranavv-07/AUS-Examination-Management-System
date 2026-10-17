import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import {
  CalendarDays,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  BookOpen,
  Layers,
} from 'lucide-react';

export const TimetableManagement: React.FC = () => {
  const exams = db.getExaminations();
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Collect all timetable slots from active exam sessions
  const slots: any[] = [];
  activeExam?.sessions.forEach(sess => {
    sess.subjects.forEach(subj => {
      slots.push({
        sessionId: sess.id,
        date: sess.date,
        shift: sess.shift,
        startTime: sess.startTime,
        endTime: sess.endTime,
        ...subj,
      });
    });
  });

  const filteredSlots = slots.filter(s => {
    if (categoryFilter !== 'ALL' && s.timetableCategory !== categoryFilter) return false;
    if (branchFilter !== 'ALL' && s.branch !== branchFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#EA580C]" />
              Examination Timetable Schedule
            </h1>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              T1, T2, T3, T4 CATEGORIES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Subject schedule by date, shift, department, semester, and timetable grouping. Conflict-free validated.
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Examination:</label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Timetable Category:</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Categories (T1 – T4)</option>
            <option value="T1">Category T1 (2nd Year Batch 1)</option>
            <option value="T2">Category T2 (2nd Year Batch 2)</option>
            <option value="T3">Category T3 (3rd Year Batch 1)</option>
            <option value="T4">Category T4 (3rd Year Batch 2)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Filter Branch:</label>
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="AIML">AIML</option>
            <option value="ECE">ECE</option>
          </select>
        </div>
      </div>

      {/* Timetable Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#002147] text-white uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Session Shift</th>
              <th className="py-2.5 px-3">Timings</th>
              <th className="py-2.5 px-3">Subject Code</th>
              <th className="py-2.5 px-3">Subject Title</th>
              <th className="py-2.5 px-3">Branch & Sem</th>
              <th className="py-2.5 px-3 text-center">Timetable Group</th>
              <th className="py-2.5 px-3 text-center">Regulation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredSlots.map((slot, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-slate-900">{slot.date}</td>
                <td className="py-2.5 px-3">
                  <span className="bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                    {slot.shift}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                  {slot.startTime} – {slot.endTime}
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{slot.subjectCode}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{slot.subjectName}</td>
                <td className="py-2.5 px-3 text-slate-600">
                  {slot.branch} (Sem {slot.semester})
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded text-[10px] border border-amber-200">
                    {slot.timetableCategory || 'T1'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center text-slate-500 font-semibold">{slot.regulation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
