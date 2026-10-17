import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { InvigilationEngine, InvigilationResult } from '../services/invigilationAlgorithm';
import { PDFGeneratorService } from '../services/pdfGenerator';
import { ExcelService } from '../services/excelService';
import { InvigilationDuty } from '../types';
import {
  UserCheck2,
  Sparkles,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const InvigilationDuties: React.FC = () => {
  const exams = db.getExaminations();
  const allFaculty = db.getFaculty();
  const settings = db.getSettings();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const currentExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    currentExam?.sessions[0]?.id || ''
  );
  const currentSession =
    currentExam?.sessions.find(s => s.id === selectedSessionId) || currentExam?.sessions[0];

  const seating = db.getSeatingArrangement(currentSession?.id || '');
  const availability = db.getFacultyAvailability(currentSession?.id || '');
  const existingDuties = db.getInvigilationDuties(currentSession?.id || '');

  const [duties, setDuties] = useState<InvigilationDuty[]>(existingDuties);
  const [invigilatorsPerRoom, setInvigilatorsPerRoom] = useState<number>(1);
  const [maxDuties, setMaxDuties] = useState<number>(4);
  const [autoBalance, setAutoBalance] = useState<boolean>(true);
  const [engineResult, setEngineResult] = useState<InvigilationResult | null>(null);
  const [notification, setNotification] = useState<string>('');

  const handleGenerateDuties = () => {
    if (!currentExam || !currentSession || !seating) return;

    const result = InvigilationEngine.generate({
      examinationId: currentExam.id,
      session: currentSession,
      roomsAllocated: seating.roomAllocations,
      allFaculty,
      availabilityRecords: availability,
      existingDutiesAcrossAllSessions: db.getInvigilationDuties(),
      invigilatorsPerRoom,
      maxDutiesPerFaculty: maxDuties,
      autoBalanceDepartments: autoBalance,
      lockedDuties: duties.filter(d => d.status === 'LOCKED'),
    });

    setDuties(result.duties);
    setEngineResult(result);
    db.saveInvigilationDuties(result.duties);
    setNotification(`Generated duty roster for ${result.totalAssigned} invigilators across ${seating.roomAllocations.length} halls.`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleToggleLock = (dutyId: string) => {
    const updated = duties.map(d => {
      if (d.id === dutyId) {
        return {
          ...d,
          status: (d.status === 'LOCKED' ? 'DRAFT' : 'LOCKED') as 'DRAFT' | 'LOCKED',
        };
      }
      return d;
    });
    setDuties(updated);
    db.saveInvigilationDuties(updated);
  };

  const handleDownloadPDF = () => {
    if (!currentExam || !currentSession || duties.length === 0) return;
    const doc = PDFGeneratorService.generateInvigilationDutyListPDF(
      duties,
      currentExam,
      currentSession,
      settings
    );
    doc.save(`ADITYA_UNIVERSITY_INVIGILATION_DUTIES_${currentSession.date}_${currentSession.shift}.pdf`);
  };

  const handleDownloadXLSX = () => {
    if (!currentExam || !currentSession || duties.length === 0) return;
    ExcelService.exportInvigilationDutiesWorkbook(duties, currentExam, currentSession);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <UserCheck2 className="w-5 h-5 text-[#EA580C]" />
              Invigilation Duty Generator
            </h1>
            <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              RULES-BASED ROSTER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly assigns faculty marked 'YES' with workload balancing, maximum duty limits, and zero simultaneous hall clashes.
          </p>
        </div>

        {duties.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Duty PDF
            </button>
            <button
              onClick={handleDownloadXLSX}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download June 2026 XLSX
            </button>
          </div>
        )}
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* Configuration & Session Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Exam:</label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date & Session:</label>
            <select
              value={selectedSessionId}
              onChange={e => setSelectedSessionId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {currentExam?.sessions.map(s => (
                <option key={s.id} value={s.id}>{s.date} — {s.shift}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Invigilators per Room:</label>
            <select
              value={invigilatorsPerRoom}
              onChange={e => setInvigilatorsPerRoom(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value={1}>1 Invigilator per Hall</option>
              <option value={2}>2 Invigilators per Hall (Standard)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Max Duties Limit:</label>
            <select
              value={maxDuties}
              onChange={e => setMaxDuties(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value={3}>Max 3 Duties</option>
              <option value={4}>Max 4 Duties (Default)</option>
              <option value={6}>Max 6 Duties</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoBalance}
              onChange={e => setAutoBalance(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Auto-balance workload evenly across Departments (CSE, ECE, EEE, MECH, CIVIL)</span>
          </label>

          <button
            onClick={handleGenerateDuties}
            disabled={!seating}
            className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {duties.length > 0 ? 'Regenerate Duty Roster' : 'Run Invigilation Engine'}
          </button>
        </div>
      </div>

      {/* Warnings & Engine Status */}
      {engineResult && engineResult.warnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Duty Allocation Shortage Warnings:
          </div>
          {engineResult.warnings.map((w, i) => (
            <p key={i}>• {w}</p>
          ))}
        </div>
      )}

      {/* Duty Assignment Table */}
      {!seating ? (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          Generate seating arrangement for this session first before allocating invigilators.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#002147] font-heading">
                Invigilation Duties Roster ({currentSession?.date} — {currentSession?.shift})
              </h3>
              <p className="text-xs text-slate-500">
                {duties.length} room assignments. Reproduces the official June 2026 university layout.
              </p>
            </div>
          </div>

          <table className="w-full text-xs text-left">
            <thead className="bg-[#002147] text-white uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">S.No</th>
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-3">Building</th>
                <th className="py-2.5 px-3">Invigilator I Name</th>
                <th className="py-2.5 px-3">Emp ID (I)</th>
                <th className="py-2.5 px-3">Dept (I)</th>
                {invigilatorsPerRoom >= 2 && (
                  <>
                    <th className="py-2.5 px-3">Invigilator II Name</th>
                    <th className="py-2.5 px-3">Emp ID (II)</th>
                    <th className="py-2.5 px-3">Dept (II)</th>
                  </>
                )}
                <th className="py-2.5 px-3 text-center">Lock Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {duties.length === 0 ? (
                <tr>
                  <td
                    colSpan={invigilatorsPerRoom >= 2 ? 10 : 7}
                    className="py-10 text-center text-slate-400 italic"
                  >
                    No invigilators rostered for this session yet. Click "Run Invigilation Engine" above to allocate available faculty across halls.
                  </td>
                </tr>
              ) : (
                duties.map((duty, idx) => (
                <tr key={duty.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-blue-900">{duty.roomNumber}</td>
                  <td className="py-2.5 px-3 text-slate-600">{duty.building.split(' ')[0]}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {duty.invigilator1?.facultyName || (
                      <span className="text-rose-600 italic">Unassigned (Shortage)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{duty.invigilator1?.employeeId || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{duty.invigilator1?.department || '—'}</td>
                  {invigilatorsPerRoom >= 2 && (
                    <>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {duty.invigilator2?.facultyName || (
                          <span className="text-slate-400 italic">Not required / Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{duty.invigilator2?.employeeId || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{duty.invigilator2?.department || '—'}</td>
                    </>
                  )}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleToggleLock(duty.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto ${
                        duty.status === 'LOCKED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      {duty.status === 'LOCKED' ? 'Locked' : 'Lock'}
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
