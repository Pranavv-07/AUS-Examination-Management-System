import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { SeatingAllocationEngine, SeatingValidationResult } from '../services/seatingAlgorithm';
import { PDFGeneratorService } from '../services/pdfGenerator';
import { ExcelService } from '../services/excelService';
import {
  SeatingArrangement as ISeatingArrangement,
  RoomAllocation,
  SeatAllocation,
  Semester,
  AcademicYear,
} from '../types';
import { Modal } from '../components/Modal';
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  DoorOpen,
  Calendar,
  Lock,
  Layers,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Users,
  Grid,
  Check,
  X,
  Info,
} from 'lucide-react';

export const SeatingArrangement: React.FC = () => {
  const exams = db.getExaminations();
  const rooms = db.getRooms();
  const students = db.getStudents();
  const settings = db.getSettings();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const currentExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    currentExam?.sessions[0]?.id || ''
  );
  const currentSession =
    currentExam?.sessions.find(s => s.id === selectedSessionId) || currentExam?.sessions[0];

  const [priorityMode, setPriorityMode] = useState<
    'TIMETABLE_GROUP_FIRST' | 'BRANCH_FIRST' | 'ROLL_NUMBER_FIRST'
  >('TIMETABLE_GROUP_FIRST');

  // Existing or newly generated seating
  const existingSeating = db.getSeatingArrangement(currentSession?.id || '');
  const [currentSeating, setCurrentSeating] = useState<ISeatingArrangement | undefined>(
    existingSeating
  );
  const [validationResult, setValidationResult] = useState<SeatingValidationResult | null>(null);
  const [selectedRoomPreview, setSelectedRoomPreview] = useState<string>(
    existingSeating?.roomAllocations[0]?.roomId || rooms[0]?.id || ''
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // --- Seat Editing Modal State ---
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<SeatAllocation | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string>('');
  const [seatIsVacant, setSeatIsVacant] = useState(false);
  const [seatSemester, setSeatSemester] = useState<Semester>('5');
  const [seatBranch, setSeatBranch] = useState('CSE');
  const [seatRollNumber, setSeatRollNumber] = useState('');
  const [seatStudentName, setSeatStudentName] = useState('');
  const [seatSubjectCode, setSeatSubjectCode] = useState('');
  const [seatSubjectName, setSeatSubjectName] = useState('');

  // --- Single-Semester Pattern Tool State ---
  const [isSingleSemModalOpen, setIsSingleSemModalOpen] = useState(false);
  const [singleSemTarget, setSingleSemTarget] = useState<Semester>('5');
  const [singleSemBranch, setSingleSemBranch] = useState('CSE');
  const [singleSemStartRoll, setSingleSemStartRoll] = useState('23A91A0501');
  const [singleSemSubjectCode, setSingleSemSubjectCode] = useState('23CS501');
  const [singleSemSubjectName, setSingleSemSubjectName] = useState('Computer Networks');

  const handleGenerate = () => {
    if (!currentExam || !currentSession) {
      alert('Please create or select an examination and session first.');
      return;
    }

    const activeRooms = rooms.filter(r => r.isActive);
    if (activeRooms.length === 0) {
      alert('No active examination rooms configured. Please add or enable rooms in Room Management.');
      return;
    }

    const { seating, validation } = SeatingAllocationEngine.generate({
      examinationId: currentExam.id,
      session: currentSession,
      rooms: activeRooms,
      allStudents: students,
      priorityMode,
    });

    setCurrentSeating(seating);
    setValidationResult(validation);
    db.saveSeatingArrangement(seating);
    setSelectedRoomPreview(seating.roomAllocations[0]?.roomId || '');
    setFeedbackMessage(
      `Successfully generated seating allocation for ${seating.totalStudentsAllocated} students across ${seating.totalRoomsUsed} rooms!`
    );
    setTimeout(() => setFeedbackMessage(''), 5000);
  };

  const handleFinalize = () => {
    if (!currentSeating) return;
    const finalized: ISeatingArrangement = {
      ...currentSeating,
      status: 'FINALIZED',
      finalizedAt: new Date().toISOString(),
      finalizedBy: db.getCurrentUser().username,
    };
    db.saveSeatingArrangement(finalized);
    setCurrentSeating(finalized);
    setFeedbackMessage('Seating plan finalized and locked for examination conduct.');
    setTimeout(() => setFeedbackMessage(''), 5000);
  };

  const handleDownloadPDF = () => {
    if (!currentSeating || !currentExam || !currentSession) return;
    const doc = PDFGeneratorService.generateSeatingArrangementSummaryPDF(
      currentSeating,
      currentExam,
      currentSession,
      settings
    );
    doc.save(`ADITYA_UNIVERSITY_SEATING_ARRANGEMENT_${currentSession.date}_${currentSession.shift}.pdf`);
  };

  const handleDownloadXLSX = () => {
    if (!currentSeating || !currentExam || !currentSession) return;
    ExcelService.exportStudentRoomAllocationXLSX(
      currentSeating.roomAllocations,
      currentExam,
      currentSession
    );
  };

  // --- Seat Click Handler: Opens Seat Editor Modal ---
  const handleSeatClick = (roomId: string, seat: SeatAllocation) => {
    setEditingRoomId(roomId);
    setEditingSeat(seat);
    setSeatIsVacant(Boolean(seat.isVacant) || !seat.rollNumber);
    setSeatSemester(seat.semester || '5');
    setSeatBranch(seat.branch || 'CSE');
    setSeatRollNumber(seat.rollNumber || '');
    setSeatStudentName(seat.studentName || '');
    setSeatSubjectCode(seat.subjectCode || '');
    setSeatSubjectName(seat.subjectName || '');
    setIsSeatModalOpen(true);
  };

  // --- Save Edited Seat ---
  const handleSaveSeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSeating || !editingSeat || !editingRoomId) return;

    // Determine academic year from semester
    const semNum = parseInt(seatSemester, 10);
    const academicYear: AcademicYear = semNum <= 2 ? '1' : semNum <= 4 ? '2' : semNum <= 6 ? '3' : '4';

    const updatedRoomAllocations = currentSeating.roomAllocations.map(room => {
      if (room.roomId !== editingRoomId) return room;

      const updatedSeats = room.seats.map(s => {
        if (s.benchId === editingSeat.benchId && s.seatIndex === editingSeat.seatIndex) {
          if (seatIsVacant) {
            return {
              ...s,
              isVacant: true,
              rollNumber: '',
              studentName: '',
              studentId: '',
              branch: seatBranch,
              semester: seatSemester,
              academicYear,
              subjectCode: '',
              subjectName: '',
            };
          } else {
            return {
              ...s,
              isVacant: false,
              rollNumber: seatRollNumber.trim().toUpperCase(),
              studentName: seatStudentName.trim() || `Student ${seatRollNumber.slice(-4)}`,
              studentId: s.studentId || `std_manual_${Date.now()}`,
              branch: seatBranch.trim().toUpperCase(),
              semester: seatSemester,
              academicYear,
              subjectCode: seatSubjectCode.trim().toUpperCase() || s.subjectCode,
              subjectName: seatSubjectName.trim() || s.subjectName,
            };
          }
        }
        return s;
      });

      const recomputedRanges = SeatingAllocationEngine.computeRollNumberRanges(updatedSeats);
      const activeCount = updatedSeats.filter(s => !s.isVacant && s.rollNumber).length;

      return {
        ...room,
        seats: updatedSeats,
        rollNumberRanges: recomputedRanges,
        totalAllotted: activeCount,
      };
    });

    const totalStudents = updatedRoomAllocations.reduce((sum, r) => sum + r.totalAllotted, 0);

    const updatedSeating: ISeatingArrangement = {
      ...currentSeating,
      roomAllocations: updatedRoomAllocations,
      totalStudentsAllocated: totalStudents,
      revision: (currentSeating.revision || 1) + 1,
    };

    setCurrentSeating(updatedSeating);
    db.saveSeatingArrangement(updatedSeating);
    setIsSeatModalOpen(false);
    setFeedbackMessage(`Updated seat ${editingSeat.seatLabel} in Room.`);
    setTimeout(() => setFeedbackMessage(''), 4000);
  };

  // --- Mark Seat Immediately as Vacant ---
  const handleMarkSeatVacant = () => {
    setSeatIsVacant(true);
    setSeatRollNumber('');
    setSeatStudentName('');
  };

  // --- Single-Semester Pattern Generator: Corner Seats Occupied, Middle Seat Empty ---
  const handleApplySingleSemPattern = () => {
    if (!currentSeating || !selectedRoomPreview) return;

    const semNum = parseInt(singleSemTarget, 10);
    const academicYear: AcademicYear = semNum <= 2 ? '1' : semNum <= 4 ? '2' : semNum <= 6 ? '3' : '4';

    let currentRollDigits = parseInt(singleSemStartRoll.replace(/\D/g, '').slice(-4), 10) || 501;
    const rollPrefix = singleSemStartRoll.replace(/\d{4}$/, '') || '23A91A05';

    const updatedRoomAllocations = currentSeating.roomAllocations.map(room => {
      if (room.roomId !== selectedRoomPreview) return room;

      const updatedSeats = room.seats.map(s => {
        // Seat Index 0: Left Corner (Occupied)
        // Seat Index 1: Middle (EMPTY / VACANT)
        // Seat Index 2: Right Corner (Occupied)
        if (s.seatIndex === 1) {
          // Middle seat is set EMPTY as requested
          return {
            ...s,
            isVacant: true,
            rollNumber: '',
            studentName: '',
            studentId: '',
            branch: singleSemBranch,
            semester: singleSemTarget,
            academicYear,
            subjectCode: '',
            subjectName: '',
          };
        } else {
          // Corner seat (Left or Right) is occupied with the single semester student
          const formattedRoll = `${rollPrefix}${String(currentRollDigits++).padStart(4, '0')}`;
          return {
            ...s,
            isVacant: false,
            rollNumber: formattedRoll,
            studentName: `Student ${formattedRoll.slice(-4)}`,
            studentId: `std_single_${formattedRoll}`,
            branch: singleSemBranch,
            semester: singleSemTarget,
            academicYear,
            subjectCode: singleSemSubjectCode,
            subjectName: singleSemSubjectName,
          };
        }
      });

      const recomputedRanges = SeatingAllocationEngine.computeRollNumberRanges(updatedSeats);
      const activeCount = updatedSeats.filter(s => !s.isVacant && s.rollNumber).length;

      return {
        ...room,
        seats: updatedSeats,
        rollNumberRanges: recomputedRanges,
        totalAllotted: activeCount,
      };
    });

    const totalStudents = updatedRoomAllocations.reduce((sum, r) => sum + r.totalAllotted, 0);

    const updatedSeating: ISeatingArrangement = {
      ...currentSeating,
      roomAllocations: updatedRoomAllocations,
      totalStudentsAllocated: totalStudents,
      revision: (currentSeating.revision || 1) + 1,
    };

    setCurrentSeating(updatedSeating);
    db.saveSeatingArrangement(updatedSeating);
    setIsSingleSemModalOpen(false);
    setFeedbackMessage(
      `Applied Single-Semester Pattern: Middle seats emptied and corners occupied for Sem ${singleSemTarget} (${singleSemBranch}).`
    );
    setTimeout(() => setFeedbackMessage(''), 5000);
  };

  // Helper color for semester badge
  const getSemesterBadgeStyle = (sem: string, isVacant?: boolean) => {
    if (isVacant) {
      return 'bg-slate-100 text-slate-500 border-dashed border-slate-300';
    }
    switch (sem) {
      case '1':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case '2':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case '3':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case '4':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case '5':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case '6':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case '7':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case '8':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#EA580C]" />
              Seating Arrangement & Hall Allocation
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              EDITABLE SEATING GRID
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive student seating layout with bench-level modification, single-semester corner patterns, and official document generation.
          </p>
        </div>

        {currentSeating && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official PDF
            </button>
            <button
              onClick={handleDownloadXLSX}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export XLSX
            </button>
            {currentSeating.status !== 'FINALIZED' && (
              <button
                onClick={handleFinalize}
                className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Finalize Seating
              </button>
            )}
          </div>
        )}
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedbackMessage}
        </div>
      )}

      {/* Control Panel: Session Selection & Configuration */}
      {exams.length > 0 ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Examination:</label>
              <select
                value={selectedExamId}
                onChange={e => {
                  setSelectedExamId(e.target.value);
                  const ex = exams.find(item => item.id === e.target.value);
                  if (ex && ex.sessions.length > 0) {
                    setSelectedSessionId(ex.sessions[0].id);
                    setCurrentSeating(db.getSeatingArrangement(ex.sessions[0].id));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {exams.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Date & Session:</label>
              <select
                value={selectedSessionId}
                onChange={e => {
                  setSelectedSessionId(e.target.value);
                  setCurrentSeating(db.getSeatingArrangement(e.target.value));
                }}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Allocation Priority Rule:</label>
              <select
                value={priorityMode}
                onChange={e => setPriorityMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TIMETABLE_GROUP_FIRST">1. Timetable Group First (T1, T2, T3, T4)</option>
                <option value="BRANCH_FIRST">2. Department / Branch First</option>
                <option value="ROLL_NUMBER_FIRST">3. Pure Roll Number Sequence</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>
                Eligible Subjects:{' '}
                <strong className="text-slate-800">
                  {currentSession?.subjects.map(s => s.subjectCode).join(', ') || 'None configured'}
                </strong>
              </span>
              <span>•</span>
              <span>
                Status:{' '}
                <strong className={currentSeating?.status === 'FINALIZED' ? 'text-emerald-700' : 'text-amber-700'}>
                  {currentSeating ? currentSeating.status : 'NOT GENERATED'}
                </strong>
              </span>
            </div>

            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {currentSeating ? 'Re-generate Seating Allocation' : 'Run Allocation Engine'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-800 font-heading">No Examinations Configured Yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            To generate seating arrangements, create an Examination schedule and assign rooms and student cohorts first.
          </p>
        </div>
      )}

      {/* Validation Summary Bar (if available) */}
      {validationResult && (
        <div
          className={`p-4 rounded-xl border text-xs ${
            validationResult.isValid
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-2">
            <span className="flex items-center gap-2 text-sm">
              {validationResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              Allocation Reconciliation & Validation Report
            </span>
            <span className="bg-white/80 px-2 py-0.5 rounded border text-[11px]">
              {validationResult.totalAllocated} of {validationResult.totalEligible} Students Placed
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
            <div>
              Total Eligible: <strong>{validationResult.totalEligible}</strong>
            </div>
            <div>
              Total Allocated: <strong>{validationResult.totalAllocated}</strong>
            </div>
            <div>
              Unallocated Shortage: <strong>{validationResult.unallocatedStudents.length}</strong>
            </div>
            <div>
              Halls Utilized: <strong>{validationResult.roomsUsed}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Seating Arrangement Summary & Room Breakdown */}
      {currentSeating && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#002147] font-heading">
                  Hall-Wise Seating Allocation & Roll Number Ranges
                </h3>
                <p className="text-xs text-slate-500">
                  Total Students: {currentSeating.totalStudentsAllocated} in {currentSeating.totalRoomsUsed} Rooms
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#002147] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Room No.</th>
                    <th className="py-2.5 px-3">Building</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3">Sem</th>
                    <th className="py-2.5 px-3">Roll Number From</th>
                    <th className="py-2.5 px-3">Roll Number To</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3 text-center">Count</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {currentSeating.roomAllocations.map(room =>
                    room.rollNumberRanges.length > 0 ? (
                      room.rollNumberRanges.map((range, idx) => (
                        <tr
                          key={`${room.roomId}_${idx}`}
                          className={`hover:bg-slate-50 transition ${
                            selectedRoomPreview === room.roomId ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          {idx === 0 ? (
                            <td
                              rowSpan={room.rollNumberRanges.length}
                              className="py-2.5 px-3 font-bold text-slate-800 align-top border-r border-slate-100 bg-slate-50/30"
                            >
                              <span className="text-blue-700 text-sm">{room.roomNumber}</span>
                              <div className="text-[10px] text-slate-400">Cap: {room.usableCapacity}</div>
                            </td>
                          ) : null}
                          {idx === 0 ? (
                            <td
                              rowSpan={room.rollNumberRanges.length}
                              className="py-2.5 px-3 text-slate-600 align-top border-r border-slate-100"
                            >
                              {room.building.split(' ')[0]}
                            </td>
                          ) : null}
                          <td className="py-2.5 px-3 font-bold text-slate-800">{range.branch}</td>
                          <td className="py-2.5 px-3 text-slate-600">Sem {range.semester}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{range.fromRoll}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{range.toRoll}</td>
                          <td className="py-2.5 px-3 text-slate-600">{range.timetableGroup || '—'}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{range.count}</td>
                          {idx === 0 ? (
                            <td
                              rowSpan={room.rollNumberRanges.length}
                              className="py-2.5 px-3 text-center align-middle border-l border-slate-100"
                            >
                              <button
                                onClick={() => setSelectedRoomPreview(room.roomId)}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer ${
                                  selectedRoomPreview === room.roomId
                                    ? 'bg-[#002147] text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                <Eye className="w-3 h-3 text-blue-400" />
                                Inspect Hall Grid
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ))
                    ) : (
                      <tr key={room.roomId} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          <span className="text-blue-700">{room.roomNumber}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{room.building}</td>
                        <td colSpan={5} className="py-2.5 px-3 text-slate-400 italic">
                          No roll number ranges (All seats vacant or unassigned)
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">0</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedRoomPreview(room.roomId)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold"
                          >
                            Inspect Hall Grid
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Editable Seat Position Grid Preview for Selected Room */}
          {selectedRoomPreview && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              {(() => {
                const room = currentSeating.roomAllocations.find(r => r.roomId === selectedRoomPreview);
                if (!room) return null;

                return (
                  <div>
                    {/* Hall Header & Tools */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
                            <DoorOpen className="w-4 h-4 text-[#EA580C]" />
                            Room Layout & Seating Map: {room.roomNumber} ({room.building})
                          </h4>
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">
                            {room.totalAllotted} Occupied / {room.usableCapacity} Capacity
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Click any seat to modify student roll number, switch semester (Sem 1 to 8), or mark vacant.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Single-Semester Pattern Button */}
                        <button
                          type="button"
                          onClick={() => setIsSingleSemModalOpen(true)}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#EA580C] border border-orange-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Grid className="w-3.5 h-3.5" />
                          Apply Single-Sem Pattern (Empty Middle Seats)
                        </button>
                      </div>
                    </div>

                    {/* Semester Legend */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 pb-1 text-[11px] font-semibold text-slate-600">
                      <span className="text-slate-400">Legend:</span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-200">
                        Sem 3
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded border bg-amber-50 text-amber-900 border-amber-200">
                        Sem 5
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded border bg-purple-50 text-purple-800 border-purple-200">
                        Sem 6 / Others
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-dashed bg-slate-100 text-slate-500 border-slate-300">
                        Empty / Vacant
                      </span>
                    </div>

                    {/* Bench and Column Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
                      {Array.from({ length: 4 }).map((_, colIdx) => {
                        const colSeats = room.seats.filter(s => s.colIndex === colIdx);
                        if (colSeats.length === 0) return null;

                        // Group seats by bench
                        const benchesInCol = Array.from(
                          new Set(colSeats.map(s => s.rowIndex))
                        ).sort((a, b) => a - b);

                        return (
                          <div key={colIdx} className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                            <div className="text-xs font-extrabold text-[#002147] uppercase text-center bg-white py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                              Column {colIdx + 1}
                            </div>

                            <div className="space-y-2.5">
                              {benchesInCol.map(rowIndex => {
                                const benchSeats = colSeats
                                  .filter(s => s.rowIndex === rowIndex)
                                  .sort((a, b) => a.seatIndex - b.seatIndex);

                                return (
                                  <div
                                    key={rowIndex}
                                    className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5"
                                  >
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1">
                                      <span>Bench {rowIndex + 1}</span>
                                      <span>Row {rowIndex + 1}</span>
                                    </div>

                                    {/* 3 Seats per bench */}
                                    <div className="grid grid-cols-3 gap-1">
                                      {benchSeats.map(seat => {
                                        const isVacant = Boolean(seat.isVacant) || !seat.rollNumber;
                                        const badgeStyle = getSemesterBadgeStyle(seat.semester, isVacant);

                                        return (
                                          <button
                                            key={`${seat.benchId}_${seat.seatIndex}`}
                                            type="button"
                                            onClick={() => handleSeatClick(room.roomId, seat)}
                                            className={`p-1.5 rounded-md border text-left transition text-[10px] cursor-pointer hover:ring-2 hover:ring-blue-400 group relative ${badgeStyle}`}
                                            title="Click to edit seat"
                                          >
                                            <div className="flex justify-between items-center text-[9px] font-bold opacity-80">
                                              <span>S{seat.seatIndex + 1}</span>
                                              <span>{isVacant ? 'VACANT' : `S${seat.semester}`}</span>
                                            </div>

                                            {isVacant ? (
                                              <div className="py-2 text-center text-[9px] text-slate-400 font-medium">
                                                — Empty —
                                              </div>
                                            ) : (
                                              <>
                                                <div className="font-mono font-bold text-xs truncate mt-0.5">
                                                  {seat.rollNumber.slice(-4)}
                                                </div>
                                                <div className="text-[9px] truncate text-slate-600 mt-0.5">
                                                  {seat.branch}
                                                </div>
                                              </>
                                            )}

                                            <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 rounded-md transition flex items-center justify-center">
                                              <Edit2 className="w-3 h-3 text-blue-700" />
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* --- Seat Editing Modal --- */}
      <Modal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        title={`Edit Seat: ${editingSeat?.seatLabel || 'Selected Seat'}`}
      >
        <form onSubmit={handleSaveSeat} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-bold text-slate-800">Seat Location Details</div>
            <div className="grid grid-cols-3 gap-2 text-slate-600">
              <div>Column: <strong>{editingSeat ? editingSeat.colIndex + 1 : ''}</strong></div>
              <div>Row/Bench: <strong>{editingSeat ? editingSeat.rowIndex + 1 : ''}</strong></div>
              <div>
                Position:{' '}
                <strong>
                  {editingSeat?.seatIndex === 0
                    ? 'Left Corner (S1)'
                    : editingSeat?.seatIndex === 1
                    ? 'Center / Middle (S2)'
                    : 'Right Corner (S3)'}
                </strong>
              </div>
            </div>
          </div>

          {/* Seat Status Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Seat Status:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSeatIsVacant(false)}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  !seatIsVacant
                    ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Occupied by Student</span>
              </button>

              <button
                type="button"
                onClick={handleMarkSeatVacant}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  seatIsVacant
                    ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <X className="w-3.5 h-3.5 text-amber-600" />
                <span>Empty / Vacant Seat</span>
              </button>
            </div>
          </div>

          {!seatIsVacant && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              {/* Semester Selector: All semesters 1 through 8 as explicitly requested */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Examination Semester (All Semesters 1 to 8):
                </label>
                <select
                  value={seatSemester}
                  onChange={e => setSeatSemester(e.target.value as Semester)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Semester 1 (1st Year B.Tech)</option>
                  <option value="2">Semester 2 (1st Year B.Tech)</option>
                  <option value="3">Semester 3 (2nd Year B.Tech)</option>
                  <option value="4">Semester 4 (2nd Year B.Tech)</option>
                  <option value="5">Semester 5 (3rd Year B.Tech)</option>
                  <option value="6">Semester 6 (3rd Year B.Tech)</option>
                  <option value="7">Semester 7 (4th Year B.Tech)</option>
                  <option value="8">Semester 8 (4th Year B.Tech)</option>
                </select>
              </div>

              {/* Department / Branch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department / Branch:</label>
                  <select
                    value={seatBranch}
                    onChange={e => setSeatBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CSE">CSE (Computer Science)</option>
                    <option value="AIML">AIML (AI & Machine Learning)</option>
                    <option value="IT">IT (Information Technology)</option>
                    <option value="ECE">ECE (Electronics & Comm)</option>
                    <option value="EEE">EEE (Electrical & Electronics)</option>
                    <option value="MECH">MECH (Mechanical)</option>
                    <option value="CIVIL">CIVIL (Civil Engineering)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Roll Number:</label>
                  <input
                    type="text"
                    required={!seatIsVacant}
                    value={seatRollNumber}
                    onChange={e => setSeatRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 23A91A0501"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name:</label>
                <input
                  type="text"
                  value={seatStudentName}
                  onChange={e => setSeatStudentName(e.target.value)}
                  placeholder="e.g. K. Rahul"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subject Code and Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code:</label>
                  <input
                    type="text"
                    value={seatSubjectCode}
                    onChange={e => setSeatSubjectCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 23CS501"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name:</label>
                  <input
                    type="text"
                    value={seatSubjectName}
                    onChange={e => setSeatSubjectName(e.target.value)}
                    placeholder="e.g. Operating Systems"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSeatModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Seat Allocation
            </button>
          </div>
        </form>
      </Modal>

      {/* --- Single-Semester Pattern Generator Modal --- */}
      <Modal
        isOpen={isSingleSemModalOpen}
        onClose={() => setIsSingleSemModalOpen(false)}
        title="Apply Single-Semester Seating Pattern (Corners Occupied, Middle Empty)"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-700" />
              <span>Single-Semester Exam Spacing Rule</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              When exams are conducted for only one semester at a time, each 3-seat bench has its middle seat left vacant, while both corner seats (Left and Right) are occupied by students to ensure strict spacing and academic integrity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Examination Semester:</label>
              <select
                value={singleSemTarget}
                onChange={e => setSingleSemTarget(e.target.value as Semester)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              >
                <option value="1">Semester 1 (1st Year)</option>
                <option value="2">Semester 2 (1st Year)</option>
                <option value="3">Semester 3 (2nd Year)</option>
                <option value="4">Semester 4 (2nd Year)</option>
                <option value="5">Semester 5 (3rd Year)</option>
                <option value="6">Semester 6 (3rd Year)</option>
                <option value="7">Semester 7 (4th Year)</option>
                <option value="8">Semester 8 (4th Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Branch:</label>
              <select
                value={singleSemBranch}
                onChange={e => setSingleSemBranch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              >
                <option value="CSE">CSE</option>
                <option value="AIML">AIML</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Starting Roll Number:</label>
            <input
              type="text"
              value={singleSemStartRoll}
              onChange={e => setSingleSemStartRoll(e.target.value.toUpperCase())}
              placeholder="e.g. 23A91A0501"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-900 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code:</label>
              <input
                type="text"
                value={singleSemSubjectCode}
                onChange={e => setSingleSemSubjectCode(e.target.value.toUpperCase())}
                placeholder="e.g. 23CS501"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name:</label>
              <input
                type="text"
                value={singleSemSubjectName}
                onChange={e => setSingleSemSubjectName(e.target.value)}
                placeholder="e.g. Operating Systems"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSingleSemModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplySingleSemPattern}
              className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Pattern to Hall
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
