import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { PDFGeneratorService } from '../services/pdfGenerator';
import { AdityaLogo } from '../components/AdityaLogo';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Save,
  Users,
} from 'lucide-react';

export const SeatingPlanAbsentees: React.FC = () => {
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

  const activeRoom =
    seating?.roomAllocations.find(r => r.roomId === selectedRoomId) ||
    seating?.roomAllocations[0];

  // Digital Attendance State for this room: rollNumber -> 'PRESENT' | 'ABSENT' | 'UNMARKED'
  const [attendanceMap, setAttendanceMap] = useState<{ [roll: string]: 'PRESENT' | 'ABSENT' | 'UNMARKED' }>({});
  const [saveMessage, setSaveMessage] = useState<string>('');

  const handleToggleAttendance = (roll: string) => {
    const current = attendanceMap[roll] || 'PRESENT';
    const next = current === 'PRESENT' ? 'ABSENT' : current === 'ABSENT' ? 'UNMARKED' : 'PRESENT';
    setAttendanceMap({ ...attendanceMap, [roll]: next });
  };

  const handleDownloadPDF = () => {
    if (!activeRoom || !currentExam || !currentSession) return;
    const doc = PDFGeneratorService.generateRoomSeatingPlanAbsenteesPDF(
      activeRoom,
      currentExam,
      currentSession,
      settings
    );
    const safeRoom = activeRoom.roomNumber.replace(/\s+/g, '_');
    doc.save(`ADITYA_UNIVERSITY_SEATING_PLAN_ABSENTEES_${safeRoom}_${currentSession.date}.pdf`);
  };

  const handleSaveDigitalAttendance = () => {
    if (!activeRoom || !currentExam || !currentSession) return;

    let present = 0;
    let absent = 0;
    let unmarked = 0;

    activeRoom.seats.forEach(s => {
      const status = attendanceMap[s.rollNumber] || 'PRESENT';
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else unmarked++;
    });

    db.saveAttendanceRecord({
      id: `att_${currentSession.id}_${activeRoom.roomId}`,
      examinationId: currentExam.id,
      sessionId: currentSession.id,
      roomId: activeRoom.roomId,
      roomNumber: activeRoom.roomNumber,
      building: activeRoom.building,
      date: currentSession.date,
      shift: currentSession.shift,
      timings: `${currentSession.startTime} TO ${currentSession.endTime}`,
      subjectTitle: currentSession.subjects.map(s => s.subjectName).join(', '),
      department: currentExam.department,
      totalAllotted: activeRoom.totalAllotted,
      totalPresent: present,
      totalAbsent: absent,
      totalUnmarked: unmarked,
      students: activeRoom.seats.map((s, idx) => ({
        sNo: idx + 1,
        studentId: s.studentId,
        rollNumber: s.rollNumber,
        studentName: s.studentName,
        branch: s.branch,
        semester: s.semester,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        answerBookletNo: '',
        studentSignature: '',
        attendanceStatus: attendanceMap[s.rollNumber] || 'PRESENT',
      })),
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setSaveMessage(`Digital attendance saved! Present: ${present}, Absent: ${absent}, Unmarked: ${unmarked}`);
    setTimeout(() => setSaveMessage(''), 5000);
  };

  // Branch statistics calculation
  const branchStats = (activeRoom?.rollNumberRanges || []).map(range => {
    const seatsInRange = activeRoom?.seats.filter(
      s => s.branch === range.branch && s.semester === range.semester
    ) || [];

    const absentStudents = seatsInRange.filter(s => attendanceMap[s.rollNumber] === 'ABSENT');
    const unmarkedStudents = seatsInRange.filter(s => attendanceMap[s.rollNumber] === 'UNMARKED');
    const presentStudents = seatsInRange.filter(
      s => !attendanceMap[s.rollNumber] || attendanceMap[s.rollNumber] === 'PRESENT'
    );

    return {
      branch: range.branch,
      semester: range.semester,
      allotted: seatsInRange.length,
      present: presentStudents.length,
      absent: absentStudents.length,
      unmarked: unmarkedStudents.length,
      absentRolls: absentStudents.map(s => s.rollNumber.slice(-4)).join(', ') || 'None',
    };
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#EA580C]" />
              Seating Plan & Absentees Statement
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              VISUAL BENCH GRID + ABSENTEES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Room-wise bench layout showing assigned roll numbers, invigilator details, and branch-wise absentees table.
          </p>
        </div>

        {activeRoom && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDigitalAttendance}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Digital Attendance
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Plan PDF
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        )}
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveMessage}
        </div>
      )}

      {/* Selectors */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Examination:</label>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">Hall / Room:</label>
          <select
            value={selectedRoomId || activeRoom?.roomId || ''}
            onChange={e => setSelectedRoomId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            {seating?.roomAllocations.map(r => (
              <option key={r.roomId} value={r.roomId}>{r.roomNumber} ({r.totalAllotted} students)</option>
            ))}
          </select>
        </div>
      </div>

      {activeRoom ? (
        <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md max-w-5xl mx-auto printable-sheet space-y-6">
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-[#002147]">
            <div className="flex items-center justify-center gap-3">
              <AdityaLogo size="md" showText={false} />
              <div>
                <h2 className="text-xl font-black text-[#002147] uppercase font-heading">
                  {settings.universityName}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {settings.examinationBranch}
                </p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{currentExam?.title}</p>
              </div>
            </div>
            <div className="inline-block bg-[#002147] text-white font-extrabold text-[11px] px-4 py-0.5 rounded uppercase mt-2">
              ROOM-WISE SEATING PLAN & ABSENTEES STATEMENT
            </div>
          </div>

          {/* Meta Bar */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
            <div>
              <span className="text-slate-500">Room No:</span>{' '}
              <strong className="text-blue-900">{activeRoom.roomNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500">Date:</span>{' '}
              <strong>{currentSession?.date} ({currentSession?.shift})</strong>
            </div>
            <div>
              <span className="text-slate-500">Allotted:</span>{' '}
              <strong className="text-blue-900">{activeRoom.totalAllotted} Students</strong>
            </div>
            <div>
              <span className="text-slate-500">Invigilator:</span>{' '}
              <strong>{activeRoom.invigilator1?.facultyName || 'Dr. K. S. Rama Krishna'}</strong>
            </div>
          </div>

          {/* Seating Grid (Top Down Representation) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Visual Room Seating Arrangement (Click seat to toggle Present / Absent / Unmarked)
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Absent
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Unmarked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/60 p-4 rounded-xl border border-slate-200">
              {Array.from({ length: 4 }).map((_, cIdx) => {
                const seatsInCol = activeRoom.seats.filter(s => s.colIndex === cIdx);
                return (
                  <div key={cIdx} className="space-y-2">
                    <div className="text-[10px] font-extrabold uppercase text-center bg-white py-1 rounded border border-slate-200 text-slate-600">
                      Column {cIdx + 1}
                    </div>
                    <div className="space-y-1.5">
                      {seatsInCol.map(seat => {
                        const isVacant = Boolean(seat.isVacant) || !seat.rollNumber;
                        if (isVacant) {
                          return (
                            <div
                              key={`${seat.benchId}_${seat.seatIndex}`}
                              className="w-full p-1.5 rounded-md border border-dashed border-slate-300 bg-slate-50/60 text-slate-400 text-center text-[10px]"
                            >
                              <div className="flex justify-between items-center text-[9px] font-bold opacity-60">
                                <span>{seat.seatLabel}</span>
                                <span>Vacant</span>
                              </div>
                              <div className="text-[10px] py-1 text-slate-400 italic">— Empty —</div>
                            </div>
                          );
                        }

                        const status = attendanceMap[seat.rollNumber] || 'PRESENT';
                        let cardStyle = 'bg-white border-slate-200 text-slate-800';
                        if (status === 'PRESENT') cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                        else if (status === 'ABSENT') cardStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                        else if (status === 'UNMARKED') cardStyle = 'bg-amber-50 border-amber-300 text-amber-900';

                        return (
                          <button
                            key={seat.studentId || `${seat.benchId}_${seat.seatIndex}`}
                            onClick={() => handleToggleAttendance(seat.rollNumber)}
                            className={`w-full p-1.5 rounded-md border text-left text-[11px] transition cursor-pointer select-none ${cardStyle}`}
                            title="Click to toggle attendance"
                          >
                            <div className="flex justify-between items-center text-[9px] font-bold opacity-80">
                              <span>{seat.seatLabel}</span>
                              <span>Sem {seat.semester} ({seat.branch})</span>
                            </div>
                            <div className="font-mono font-bold text-xs mt-0.5">{seat.rollNumber}</div>
                            <div className="truncate text-[9px] mt-0.5 opacity-90">{seat.studentName}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branch-Wise Absentees Statement Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Branch-Wise Absentees Statement
            </h3>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#002147] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Branch</th>
                    <th className="py-2 px-3">Semester</th>
                    <th className="py-2 px-3 text-center">Allotted</th>
                    <th className="py-2 px-3 text-center">Present</th>
                    <th className="py-2 px-3 text-center">Absent</th>
                    <th className="py-2 px-3 text-center">Unmarked</th>
                    <th className="py-2 px-3">Absent Roll Numbers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {branchStats.map((st, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-800">{st.branch}</td>
                      <td className="py-2 px-3 text-slate-600">Semester {st.semester}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{st.allotted}</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">{st.present}</td>
                      <td className="py-2 px-3 text-center font-bold text-rose-700">{st.absent}</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-700">{st.unmarked}</td>
                      <td className="py-2 px-3 font-mono font-bold text-rose-700">{st.absentRolls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 text-center text-xs font-bold text-slate-700">
            <div>
              <p className="mb-6">____________________________________</p>
              <p className="uppercase text-[11px]">Signature of Invigilator(s)</p>
            </div>
            <div>
              <p className="mb-6">____________________________________</p>
              <p className="uppercase text-[11px]">Chief Superintendent Signature</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#002147] font-heading">
              No Seating Allocation Available
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              To view the official room layout and record student absentees, ensure an examination is scheduled and generate seating in the Seating Allocation module.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <a
              href="#seating_generator"
              onClick={e => {
                e.preventDefault();
                window.location.hash = 'seating_generator';
              }}
              className="px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              Go to Seating Generator
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
