import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  Student,
  Faculty,
  InvigilationDuty,
  Examination,
  ExamSession,
  RoomAllocation,
  PortalSettings,
} from '../types';
import { PDFGeneratorService } from './pdfGenerator';

// Sanitize cell values against spreadsheet formula injection
function sanitizeCellValue(val: any): any {
  if (typeof val === 'string') {
    if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
      return `'${val}`;
    }
  }
  return val;
}

export class ExcelService {
  // --- 1. Export Student Template ---
  public static exportStudentTemplate(): void {
    const data = [
      {
        'Roll Number': '23A91A0501',
        'Student Name': 'SAMPLE STUDENT ONE',
        Branch: 'CSE',
        'Academic Year': '2',
        Semester: '3',
        Section: 'A',
        'Minor Stream': 'Data Science',
        'Timetable Group': 'T1',
        Eligible: 'YES',
      },
      {
        'Roll Number': '23A91A0502',
        'Student Name': 'SAMPLE STUDENT TWO',
        Branch: 'CSE',
        'Academic Year': '2',
        Semester: '3',
        Section: 'A',
        'Minor Stream': '',
        'Timetable Group': 'T1',
        Eligible: 'YES',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
    XLSX.writeFile(wb, 'ADITYA_UNIVERSITY_STUDENT_IMPORT_TEMPLATE.xlsx');
  }

  // --- 2. Export Faculty Template ---
  public static exportFacultyTemplate(): void {
    const data = [
      {
        'Employee ID': 'AU_FAC_101',
        'Faculty Name': 'Dr. Sample Faculty',
        Department: 'CSE',
        Designation: 'Associate Professor',
        Email: 'sample@adityauniversity.in',
        Phone: '9848123456',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty_Template');
    XLSX.writeFile(wb, 'ADITYA_UNIVERSITY_FACULTY_IMPORT_TEMPLATE.xlsx');
  }

  // --- 3. Parse Uploaded Excel/CSV File ---
  public static async parseExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const buffer = e.target?.result;
          const wb = XLSX.read(buffer, { type: 'binary' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = err => reject(err);
      reader.readAsBinaryString(file);
    });
  }

  // --- 4. Export Invigilation Duties Workbook (matching June-2026 reference) ---
  public static exportInvigilationDutiesWorkbook(
    duties: InvigilationDuty[],
    exam: Examination,
    session: ExamSession
  ): void {
    const titleRows = [
      ['ADITYA UNIVERSITY — SURAMPALEM'],
      ['EXAMINATION SECTION — OFFICE OF THE CONTROLLER OF EXAMINATIONS'],
      [`EXAMINATION: ${exam.title}`],
      [`DATE OF EXAM: ${session.date} | SESSION: ${session.shift} (${session.startTime} TO ${session.endTime})`],
      ['INVIGILATION DUTIES STATEMENT'],
      [], // blank separator
    ];

    const dataHeaders = [
      'S. No.',
      'Room Number',
      'Building / Block',
      'Invigilator I Name',
      'Employee ID',
      'Department',
      'Invigilator II Name',
      'Employee ID (II)',
      'Department (II)',
      'Status',
    ];

    const tableRows = duties.map((d, index) => [
      index + 1,
      sanitizeCellValue(d.roomNumber),
      sanitizeCellValue(d.building),
      sanitizeCellValue(d.invigilator1?.facultyName || 'Unassigned'),
      sanitizeCellValue(d.invigilator1?.employeeId || '—'),
      sanitizeCellValue(d.invigilator1?.department || '—'),
      sanitizeCellValue(d.invigilator2?.facultyName || '—'),
      sanitizeCellValue(d.invigilator2?.employeeId || '—'),
      sanitizeCellValue(d.invigilator2?.department || '—'),
      sanitizeCellValue(d.status),
    ]);

    const combined = [...titleRows, dataHeaders, ...tableRows];
    const ws = XLSX.utils.aoa_to_sheet(combined);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 26 },
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invigilation_Duties');
    const safeDate = session.date.replace(/-/g, '_');
    XLSX.writeFile(wb, `ADITYA_UNIVERSITY_INVIGILATION_DUTIES_${safeDate}_${session.shift}.xlsx`);
  }

  // --- 5. Export Student to Room Allocations XLSX ---
  public static exportStudentRoomAllocationXLSX(
    rooms: RoomAllocation[],
    exam: Examination,
    session: ExamSession
  ): void {
    const rows: any[] = [];
    for (const r of rooms) {
      for (const s of r.seats) {
        rows.push({
          'Room Number': sanitizeCellValue(r.roomNumber),
          Building: sanitizeCellValue(r.building),
          'Bench No': s.benchNumber,
          'Seat Position': s.seatIndex + 1,
          'Roll Number': sanitizeCellValue(s.rollNumber),
          'Student Name': sanitizeCellValue(s.studentName),
          Branch: sanitizeCellValue(s.branch),
          Semester: sanitizeCellValue(s.semester),
          Section: sanitizeCellValue(s.section),
          'Subject Code': sanitizeCellValue(s.subjectCode),
          'Subject Name': sanitizeCellValue(s.subjectName),
          'Timetable Group': sanitizeCellValue(s.timetableGroup || ''),
        });
      }
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student_Allocations');
    const safeDate = session.date.replace(/-/g, '_');
    XLSX.writeFile(wb, `ADITYA_UNIVERSITY_STUDENT_SEATING_ALLOCATION_${safeDate}.xlsx`);
  }

  // --- 6. Bulk Room Attendance Sheets ZIP Generation ---
  public static async generateBulkAttendanceZip(
    rooms: RoomAllocation[],
    exam: Examination,
    session: ExamSession,
    settings: PortalSettings
  ): Promise<Blob> {
    const zip = new JSZip();

    for (const room of rooms) {
      const doc = PDFGeneratorService.generateStudentAttendanceSheetPDF(room, exam, session, settings);
      const pdfBlob = doc.output('blob');
      const safeRoom = room.roomNumber.replace(/\s+/g, '_');
      const filename = `ATTENDANCE_${safeRoom}_${session.date}_${session.shift}.pdf`;
      zip.file(filename, pdfBlob);
    }

    return await zip.generateAsync({ type: 'blob' });
  }
}
