import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { PDFGeneratorService } from '../services/pdfGenerator';
import { ExcelService } from '../services/excelService';
import {
  Files,
  Download,
  FileSpreadsheet,
  FileText,
  Archive,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const GeneratedDocuments: React.FC = () => {
  const exams = db.getExaminations();
  const settings = db.getSettings();
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  // Generate catalog of available outputs from finalized exams
  const availableDocs = [
    {
      id: 'doc_seating_summary',
      title: 'Official Seating Arrangement Statement',
      category: 'Seating',
      format: 'PDF',
      examTitle: exams[0]?.title || 'B.Tech Examinations',
      sessionInfo: '2026-10-20 (FN)',
      downloadAction: () => {
        const seating = db.getSeatingArrangements()[0];
        if (seating && exams[0]) {
          const doc = PDFGeneratorService.generateSeatingArrangementSummaryPDF(
            seating,
            exams[0],
            exams[0].sessions[0],
            settings
          );
          doc.save(`ADITYA_UNIVERSITY_SEATING_ARRANGEMENT_2026_10_20.pdf`);
          setFeedback('Downloaded Seating Arrangement PDF');
        }
      },
    },
    {
      id: 'doc_attendance_rtb201',
      title: 'Student Attendance Sheet — RTB 201 (Mandatory 5-Column)',
      category: 'Attendance',
      format: 'PDF',
      examTitle: exams[0]?.title || 'B.Tech Examinations',
      sessionInfo: 'Room: RTB 201 • 72 Students',
      downloadAction: () => {
        const seating = db.getSeatingArrangements()[0];
        if (seating?.roomAllocations[0] && exams[0]) {
          const doc = PDFGeneratorService.generateStudentAttendanceSheetPDF(
            seating.roomAllocations[0],
            exams[0],
            exams[0].sessions[0],
            settings
          );
          doc.save(`ADITYA_UNIVERSITY_ATTENDANCE_RTB_201.pdf`);
          setFeedback('Downloaded Attendance Sheet for RTB 201');
        }
      },
    },
    {
      id: 'doc_seating_plan_rtb201',
      title: 'Seating Plan & Absentees Statement — RTB 201',
      category: 'Seating Plan',
      format: 'PDF',
      examTitle: exams[0]?.title || 'B.Tech Examinations',
      sessionInfo: 'Visual Bench Layout & Absentees Table',
      downloadAction: () => {
        const seating = db.getSeatingArrangements()[0];
        if (seating?.roomAllocations[0] && exams[0]) {
          const doc = PDFGeneratorService.generateRoomSeatingPlanAbsenteesPDF(
            seating.roomAllocations[0],
            exams[0],
            exams[0].sessions[0],
            settings
          );
          doc.save(`ADITYA_UNIVERSITY_SEATING_PLAN_ABSENTEES_RTB_201.pdf`);
          setFeedback('Downloaded Seating Plan & Absentees Statement');
        }
      },
    },
    {
      id: 'doc_invigilation_duties_xlsx',
      title: 'Invigilation Duties Statement (Official June-2026 Layout)',
      category: 'Duties',
      format: 'XLSX',
      examTitle: exams[0]?.title || 'B.Tech Examinations',
      sessionInfo: 'Session 1: Forenoon (09:30 AM – 12:30 PM)',
      downloadAction: () => {
        const duties = db.getInvigilationDuties();
        if (exams[0] && exams[0].sessions[0]) {
          ExcelService.exportInvigilationDutiesWorkbook(duties, exams[0], exams[0].sessions[0]);
          setFeedback('Downloaded Invigilation Duties Workbook (XLSX)');
        }
      },
    },
    {
      id: 'doc_bulk_attendance_zip',
      title: 'Bulk Room-Wise Attendance Sheets (Complete ZIP)',
      category: 'Attendance',
      format: 'ZIP',
      examTitle: exams[0]?.title || 'B.Tech Examinations',
      sessionInfo: 'All Exam Halls in Session',
      downloadAction: async () => {
        const seating = db.getSeatingArrangements()[0];
        if (seating && exams[0] && exams[0].sessions[0]) {
          const zip = await ExcelService.generateBulkAttendanceZip(
            seating.roomAllocations,
            exams[0],
            exams[0].sessions[0],
            settings
          );
          const url = URL.createObjectURL(zip);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ADITYA_UNIVERSITY_ALL_ROOM_ATTENDANCE_SHEETS.zip`;
          a.click();
          setFeedback('Downloaded Bulk Attendance ZIP');
        }
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
            <Files className="w-5 h-5 text-[#EA580C]" />
            Generated Documents Hub & Downloads
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Download official Aditya University examination documents, attendance registers, duty rosters, and archives.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableDocs.map(doc => (
          <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  {doc.category}
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                  doc.format === 'PDF' ? 'bg-rose-100 text-rose-800' : doc.format === 'XLSX' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {doc.format}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{doc.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{doc.examTitle}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{doc.sessionInfo}</p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={doc.downloadAction}
                className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download {doc.format}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
