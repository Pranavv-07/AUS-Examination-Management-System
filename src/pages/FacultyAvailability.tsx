import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { AvailabilityStatus, FacultyAvailability as IFacultyAvailability } from '../types';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  Share2,
  Sparkles,
  Save,
  Users,
} from 'lucide-react';

export const FacultyAvailability: React.FC = () => {
  const exams = db.getExaminations();
  const allFaculty = db.getFaculty();
  const departments = db.getDepartments();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const currentExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    currentExam?.sessions[0]?.id || ''
  );
  const currentSession =
    currentExam?.sessions.find(s => s.id === selectedSessionId) || currentExam?.sessions[0];

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<string>('');

  // Get availability records for this session
  const availabilityList = db.getFacultyAvailability(currentSession?.id || '');

  // Map of facultyId -> AvailabilityStatus
  const statusMap = new Map<string, AvailabilityStatus>();
  availabilityList.forEach(a => statusMap.set(a.facultyId, a.status));

  const handleSetStatus = (facultyId: string, status: AvailabilityStatus) => {
    if (!currentExam || !currentSession) return;
    const fac = allFaculty.find(f => f.id === facultyId);
    if (!fac) return;

    db.saveFacultyAvailability({
      id: `avail_${currentSession.id}_${fac.id}`,
      facultyId: fac.id,
      employeeId: fac.employeeId,
      facultyName: fac.facultyName,
      department: fac.department,
      examinationId: currentExam.id,
      sessionId: currentSession.id,
      date: currentSession.date,
      shift: currentSession.shift,
      status,
      updatedAt: new Date().toISOString(),
    });

    setFeedback(`Updated availability for ${fac.facultyName} to ${status}`);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleBulkMarkYes = () => {
    if (!currentExam || !currentSession) return;
    const records: IFacultyAvailability[] = allFaculty
      .filter(f => f.isActive && (selectedDept === 'ALL' || f.department === selectedDept))
      .map(f => ({
        id: `avail_${currentSession.id}_${f.id}`,
        facultyId: f.id,
        employeeId: f.employeeId,
        facultyName: f.facultyName,
        department: f.department,
        examinationId: currentExam.id,
        sessionId: currentSession.id,
        date: currentSession.date,
        shift: currentSession.shift,
        status: 'YES',
        updatedAt: new Date().toISOString(),
      }));

    db.bulkSaveFacultyAvailability(records);
    setFeedback(`Marked ${records.length} faculty as YES (Available) for this session!`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const filteredFaculty = allFaculty.filter(f => {
    if (selectedDept !== 'ALL' && f.department !== selectedDept) return false;
    const st = statusMap.get(f.id) || 'UNANSWERED';
    if (filterStatus !== 'ALL' && st !== filterStatus) return false;
    return true;
  });

  const totalYes = allFaculty.filter(f => statusMap.get(f.id) === 'YES').length;
  const totalNo = allFaculty.filter(f => statusMap.get(f.id) === 'NO').length;
  const totalUnanswered = allFaculty.length - totalYes - totalNo;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#EA580C]" />
              Faculty Invigilation Availability
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              ROSTER VERIFICATION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect session-wise faculty availability. Only confirmed 'YES' faculty can be assigned to exam duties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkMarkYes}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Quick Mark All 'YES' (Demo)
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Roster Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Available (YES)</p>
            <h3 className="text-2xl font-black text-emerald-800 font-heading">{totalYes}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Unavailable (NO)</p>
            <h3 className="text-2xl font-black text-rose-800 font-heading">{totalNo}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Unanswered</p>
            <h3 className="text-2xl font-black text-slate-700 font-heading">{totalUnanswered}</h3>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Exam:</label>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Session:</label>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            {currentExam?.sessions.map(s => (
              <option key={s.id} value={s.id}>{s.date} ({s.shift})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Filter Department:</label>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Response Filter:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Responses</option>
            <option value="YES">Confirmed Available (YES)</option>
            <option value="NO">Unavailable (NO)</option>
            <option value="UNANSWERED">Unanswered</option>
          </select>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#002147] text-white uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Emp ID</th>
              <th className="py-2.5 px-3">Faculty Name</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Designation</th>
              <th className="py-2.5 px-3 text-center">Current Status</th>
              <th className="py-2.5 px-3 text-center">Mark Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredFaculty.map(fac => {
              const status = statusMap.get(fac.id) || 'UNANSWERED';
              return (
                <tr key={fac.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{fac.employeeId}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{fac.facultyName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{fac.department}</td>
                  <td className="py-2.5 px-3 text-slate-500">{fac.designation}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        status === 'YES'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : status === 'NO'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleSetStatus(fac.id, 'YES')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          status === 'YES'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        YES
                      </button>
                      <button
                        onClick={() => handleSetStatus(fac.id, 'NO')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          status === 'NO'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        NO
                      </button>
                      <button
                        onClick={() => handleSetStatus(fac.id, 'UNANSWERED')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          status === 'UNANSWERED'
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        RESET
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
