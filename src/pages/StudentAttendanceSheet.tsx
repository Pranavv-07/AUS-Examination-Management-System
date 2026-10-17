import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { PDFGeneratorService } from '../services/pdfGenerator';
import { ExcelService } from '../services/excelService';
import { AdityaLogo } from '../components/AdityaLogo';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Archive,
  DoorOpen,
  Calendar,
  CheckCircle2,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export const StudentAttendanceSheet: React.FC = () => {
  const exams = db.getExaminations();
  const settings = db.getSettings();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const currentExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    currentExam?.sessions[0]?.id || ''
  );
  const currentSession =
    currentExam?.sessions.find(s => s.id === selectedSessionId) || currentExam?.sessions[0];

  const seating = db.getSeatingArrangement(currentSession?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>('');

  const activeRoom =
    seating?.roomAllocations.find(r => r.roomId === selectedRoomId) ||
    seating?.roomAllocations[0];

  const handleDownloadSingleRoomPDF = (roomId: string) => {
    const room = seating?.roomAllocations.find(r => r.roomId === roomId);
    if (!room || !currentExam || !currentSession) return;

    const doc = PDFGeneratorService.generateStudentAttendanceSheetPDF(
      room,
      currentExam,
      currentSession,
      settings
    );
    const safeRoom = room.roomNumber.replace(/\s+/g, '_');
    doc.save(`ADITYA_UNIVERSITY_ATTENDANCE_${safeRoom}_${currentSession.date}_${currentSession.shift}.pdf`);
  };

  const handleBulkZipDownload = async () => {
    if (!seating || !currentExam || !currentSession) return;
    setIsGeneratingZip(true);
    setNotification('Compiling room-wise attendance registers into ZIP...');

    try {
      const zipBlob = await ExcelService.generateBulkAttendanceZip(
        seating.roomAllocations,
        currentExam,
        currentSession,
        settings
      );
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ADITYA_UNIVERSITY_ALL_ROOMS_ATTENDANCE_${currentSession.date}_${currentSession.shift}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setNotification('Bulk ZIP archive downloaded successfully!');
    } catch (e) {
      setNotification(`Failed to generate ZIP: ${(e as Error).message}`);
    } finally {
      setIsGeneratingZip(false);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handlePrintCurrentRoom = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#EA580C]" />
              Student Attendance Sheet Generator
            </h1>
            <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              MANDATORY 5-COLUMN REGISTER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact university header, room parameters, and official five columns: S. No., Roll Number, Student Name, Answer Booklet No., Student Signature.
          </p>
        </div>

        {seating && seating.roomAllocations.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => activeRoom && handleDownloadSingleRoomPDF(activeRoom.roomId)}
              className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Room PDF
            </button>
            <button
              onClick={handlePrintCurrentRoom}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Sheet
            </button>
            <button
              onClick={handleBulkZipDownload}
              disabled={isGeneratingZip}
              className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              {isGeneratingZip ? 'Generating...' : 'Bulk Download All Rooms (ZIP)'}
            </button>
          </div>
        )}
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* Control Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Examination:</label>
          <select
            value={selectedExamId}
            onChange={e => {
              setSelectedExamId(e.target.value);
              const ex = exams.find(item => item.id === e.target.value);
              if (ex && ex.sessions.length > 0) {
                setSelectedSessionId(ex.sessions[0].id);
              }
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Examination Session:</label>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currentExam?.sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.date} — {s.shift} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Hall / Room:</label>
          <select
            value={selectedRoomId || activeRoom?.roomId || ''}
            onChange={e => setSelectedRoomId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {seating?.roomAllocations.map(r => (
              <option key={r.roomId} value={r.roomId}>
                {r.roomNumber} ({r.building.split(' ')[0]}) — {r.totalAllotted} Students
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Check if seating has been generated */}
      {!seating ? (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No Seating Allocation Found for this Session
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please run the Seating Arrangement Generator first so student room assignments and roll numbers are finalized.
          </p>
        </div>
      ) : activeRoom ? (
        /* EXACT MANDATORY STUDENT ATTENDANCE SHEET LAYOUT */
        <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md max-w-4xl mx-auto printable-sheet">
          {/* A. EXACT UNIVERSITY HEADER */}
          <div className="text-center pb-3 border-b-2 border-[#002147] relative">
            <div className="flex items-center justify-center gap-4">
              <AdityaLogo size="lg" showText={false} />
              <div>
                <h2 className="text-2xl font-black text-[#002147] tracking-tight uppercase font-heading leading-tight">
                  {settings.universityName || 'ADITYA UNIVERSITY'}
                </h2>
                <p className="text-[11px] text-slate-600 font-medium">
                  {settings.universityAddress}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
                  {settings.accreditationText}
                </p>
                <p className="text-xs font-extrabold text-[#EA580C] uppercase tracking-wider mt-0.5">
                  {settings.examinationBranch || 'EXAMINATION SECTION — OFFICE OF THE CONTROLLER OF EXAMINATIONS'}
                </p>
              </div>
            </div>

            <div className="h-0.5 bg-[#EA580C] w-full mt-2 mb-2"></div>

            <p className="text-sm font-bold text-slate-900 uppercase">
              {currentExam?.title}
            </p>

            <div className="inline-block bg-[#002147] text-white font-extrabold text-xs px-6 py-1 rounded uppercase tracking-wider mt-1.5 shadow-xs">
              STUDENT ATTENDANCE SHEET
            </div>
          </div>

          {/* B. ROOM & EXAMINATION DETAILS BAR */}
          <div className="bg-slate-50 border border-slate-300 p-3 mt-3 grid grid-cols-2 text-xs font-semibold text-slate-800 gap-y-1">
            <div>
              <span className="text-slate-500 font-medium">Room Number: </span>
              <strong className="text-blue-900 font-bold">{activeRoom.roomNumber} ({activeRoom.building})</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Total Students Allotted: </span>
              <strong className="text-blue-900 font-bold">{activeRoom.totalAllotted}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Date of Exam: </span>
              <strong>{currentSession?.date} ({currentSession?.shift})</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Exam Timings: </span>
              <strong>{currentSession?.startTime} TO {currentSession?.endTime}</strong>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200 mt-1">
              <span className="text-slate-500 font-medium">Branches / Semesters: </span>
              <span>
                {activeRoom.rollNumberRanges
                  .map(r => `${r.branch} (Sem ${r.semester}: ${r.fromRoll} - ${r.toRoll})`)
                  .join(' | ')}
              </span>
            </div>
          </div>

          {/* C. ATTENDANCE REGISTER TABLE — EXACTLY 5 COLUMNS IN THIS ORDER */}
          <div className="mt-4 overflow-hidden border border-slate-800">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#002147] text-white">
                <tr>
                  <th className="border border-slate-700 py-2.5 px-2 text-center w-12 font-bold uppercase text-[11px]">
                    S. No.
                  </th>
                  <th className="border border-slate-700 py-2.5 px-3 text-center w-36 font-bold uppercase text-[11px]">
                    Roll Number
                  </th>
                  <th className="border border-slate-700 py-2.5 px-3 text-left font-bold uppercase text-[11px]">
                    Student Name
                  </th>
                  <th className="border border-slate-700 py-2.5 px-3 text-center w-48 font-bold uppercase text-[11px]">
                    Answer Booklet No.
                  </th>
                  <th className="border border-slate-700 py-2.5 px-3 text-center w-44 font-bold uppercase text-[11px]">
                    Student Signature
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {[...activeRoom.seats]
                  .filter(s => !s.isVacant && s.rollNumber && s.rollNumber.trim() !== '')
                  .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
                  .map((seat, index) => (
                    <tr key={seat.studentId} className="h-10 hover:bg-slate-50">
                      <td className="border border-slate-300 text-center font-bold text-slate-700">
                        {index + 1}
                      </td>
                      <td className="border border-slate-300 text-center font-mono font-bold text-slate-900 text-sm tracking-tight">
                        {seat.rollNumber}
                      </td>
                      <td className="border border-slate-300 px-3 font-semibold text-slate-800 uppercase">
                        {seat.studentName}
                        <span className="text-[10px] text-slate-400 font-normal ml-1.5 lowercase">
                          ({seat.branch})
                        </span>
                      </td>
                      {/* Blank adequate box for handwritten Answer Booklet Number */}
                      <td className="border border-slate-300 bg-white"></td>
                      {/* Blank adequate box for manual student signature */}
                      <td className="border border-slate-300 bg-white"></td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-800">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-slate-700">
                    Total Students Allotted to this Hall:
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-center text-sm text-[#002147] font-black">
                    {activeRoom.totalAllotted} Students
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* D. SIGNATURE BLOCK AT BOTTOM */}
          <div className="mt-12 pt-4 border-t border-slate-300 grid grid-cols-3 text-center text-xs font-bold text-slate-800">
            <div>
              <p className="mb-8">________________________________</p>
              <p className="uppercase text-[11px]">Signature of Invigilator - I</p>
              <p className="text-[10px] text-slate-500 font-normal">Name & Employee ID</p>
            </div>
            <div>
              <p className="mb-8">________________________________</p>
              <p className="uppercase text-[11px]">Signature of Invigilator - II</p>
              <p className="text-[10px] text-slate-500 font-normal">Name & Employee ID</p>
            </div>
            <div>
              <p className="mb-8">________________________________</p>
              <p className="uppercase text-[11px]">Chief Superintendent</p>
              <p className="text-[10px] text-slate-500 font-normal">Office of COE, Aditya University</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <p className="text-xs text-slate-500">
            No rooms available in this session's seating allocation.
          </p>
        </div>
      )}
    </div>
  );
};
