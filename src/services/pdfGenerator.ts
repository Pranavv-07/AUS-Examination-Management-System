import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  SeatingArrangement,
  RoomAllocation,
  Examination,
  ExamSession,
  PortalSettings,
  InvigilationDuty,
} from '../types';
import { getAdityaLogoDataUrl } from '../components/AdityaLogo';

// Extend jsPDF interface for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export class PDFGeneratorService {
  // --- 1. Shared Exact University Header Component ---
  public static addUniversityHeader(
    doc: jsPDF,
    settings: PortalSettings,
    documentTitle: string,
    examTitle: string,
    examDate: string,
    shift: string,
    timings = '09:30 AM TO 12:30 PM'
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // University Logo on Left
    try {
      const logoData = settings.logoUrl || getAdityaLogoDataUrl();
      if (logoData) {
        doc.addImage(logoData, 'PNG', 14, 10, 20, 20);
      }
    } catch {
      // Graceful fallback if image data fails
    }

    // Header Typography
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 33, 71); // Aditya Deep Navy Blue #002147
    doc.text(settings.universityName || 'ADITYA UNIVERSITY', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text(settings.universityAddress || 'Surampalem, ADB Road, Kakinada District, A.P - 533437', pageWidth / 2, 19, { align: 'center' });
    doc.text(settings.accreditationText || 'Approved by AICTE | Accredited by NAAC with A++ Grade | Recognized by UGC', pageWidth / 2, 23, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(234, 88, 12); // Aditya Orange #EA580C
    doc.text(settings.examinationBranch || 'EXAMINATION SECTION — OFFICE OF CONTROLLER OF EXAMINATIONS', pageWidth / 2, 28, { align: 'center' });

    // Header divider line
    doc.setDrawColor(0, 33, 71);
    doc.setLineWidth(0.8);
    doc.line(14, 31, pageWidth - 14, 31);
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.3);
    doc.line(14, 32, pageWidth - 14, 32);

    // Examination Details Box
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(examTitle, pageWidth / 2, 37, { align: 'center' });

    // Document Title Banner
    doc.setFillColor(0, 33, 71);
    doc.roundedRect(pageWidth / 2 - 50, 40, 100, 6.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(documentTitle, pageWidth / 2, 44.5, { align: 'center' });

    // Date & Session Bar
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(`DATE OF EXAM: ${examDate} (${shift})`, 14, 51);
    doc.text(`EXAM TIMINGS: ${timings}`, pageWidth - 14, 51, { align: 'right' });

    return 54; // Returns the starting Y coordinate for document body
  }

  // --- 2. MANDATORY STUDENT ATTENDANCE SHEET ---
  // Exactly these 5 columns in this order: S. No., Roll Number, Student Name, Answer Booklet No., Student Signature
  public static generateStudentAttendanceSheetPDF(
    roomAllocation: RoomAllocation,
    examination: Examination,
    session: ExamSession,
    settings: PortalSettings
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const startY = this.addUniversityHeader(
      doc,
      settings,
      'STUDENT ATTENDANCE SHEET',
      examination.title,
      session.date,
      session.shift,
      `${session.startTime} TO ${session.endTime}`
    );

    // Room Details Bar
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200, 210, 220);
    doc.rect(14, startY, pageWidth - 28, 12, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 33, 71);
    doc.text(`ROOM NO: ${roomAllocation.roomNumber} (${roomAllocation.building})`, 18, startY + 5);
    doc.text(`FLOOR: ${roomAllocation.floor}`, 18, startY + 9.5);

    doc.text(`ALLOTTED STUDENTS: ${roomAllocation.totalAllotted}`, pageWidth - 18, startY + 5, { align: 'right' });
    doc.text(`BRANCHES: ${roomAllocation.rollNumberRanges.map(r => r.branch).join(', ')}`, pageWidth - 18, startY + 9.5, { align: 'right' });

    // Sort students roll-number wise (excluding vacant/empty seats)
    const sortedSeats = [...roomAllocation.seats]
      .filter(s => !s.isVacant && s.rollNumber && s.rollNumber.trim() !== '')
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    // EXACT 5 COLUMNS IN THIS ORDER
    const tableHeaders = [
      ['S. No.', 'Roll Number', 'Student Name', 'Answer Booklet No.', 'Student Signature']
    ];

    const tableRows = sortedSeats.map((seat, index) => [
      index + 1,
      seat.rollNumber,
      seat.studentName,
      '', // Blank for handwritten entry by invigilator
      '', // Blank for manual student signature
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableRows,
      startY: startY + 15,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        textColor: [20, 20, 20],
        lineColor: [180, 190, 205],
        lineWidth: 0.2,
        valign: 'middle',
        minCellHeight: 8.5, // Adequate space for handwriting and signature
      },
      headStyles: {
        fillColor: [0, 33, 71],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        minCellHeight: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', fontStyle: 'bold', cellWidth: 32 },
        2: { halign: 'left', cellWidth: 58 },
        3: { halign: 'center', cellWidth: 40 }, // Generous blank box for Answer Booklet No.
        4: { halign: 'center', cellWidth: 37 }, // Generous space for Student Signature
      },
      didDrawPage: () => {
        // Page footer with pagination
        const str = `Page ${doc.internal.pages.length - 1} • Room: ${roomAllocation.roomNumber} • Aditya University Examination Section`;
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      },
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    // Signatures and Total block
    if (finalY < doc.internal.pageSize.getHeight() - 30) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);
      doc.text(`TOTAL STUDENTS ALLOTTED: ${roomAllocation.totalAllotted}`, 14, finalY);

      doc.setFont('helvetica', 'normal');
      doc.text('Signature of Invigilator - I', 14, finalY + 18);
      doc.text('Signature of Invigilator - II', pageWidth / 2, finalY + 18, { align: 'center' });
      doc.text('Chief Superintendent / Officer In-Charge', pageWidth - 14, finalY + 18, { align: 'right' });
    }

    return doc;
  }

  // --- 3. OFFICIAL SEATING ARRANGEMENT PDF ---
  public static generateSeatingArrangementSummaryPDF(
    seating: SeatingArrangement,
    examination: Examination,
    session: ExamSession,
    settings: PortalSettings
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const startY = this.addUniversityHeader(
      doc,
      settings,
      'SEATING ARRANGEMENT STATEMENT',
      examination.title,
      session.date,
      session.shift,
      `${session.startTime} TO ${session.endTime}`
    );

    const headers = [
      ['S.No', 'Room No.', 'Building', 'Branch', 'Sem', 'Roll No. From', 'Roll No. To', 'Cat', 'Count']
    ];

    const rows: any[] = [];
    let sNo = 1;

    for (const room of seating.roomAllocations) {
      for (const range of room.rollNumberRanges) {
        rows.push([
          sNo++,
          room.roomNumber,
          room.building.split(' ')[0],
          range.branch,
          `Sem ${range.semester}`,
          range.fromRoll,
          range.toRoll,
          range.timetableGroup || '—',
          range.count,
        ]);
      }
    }

    // Grand total row
    rows.push([
      { content: 'GRAND TOTAL ALLOTTED', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${seating.totalStudentsAllocated}`, styles: { halign: 'center', fontStyle: 'bold' } }
    ]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: startY + 5,
      theme: 'grid',
      styles: {
        fontSize: 8,
        textColor: [30, 30, 30],
        lineColor: [180, 190, 200],
        lineWidth: 0.2,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [0, 33, 71],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 24 },
        3: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 28 },
        6: { halign: 'center', cellWidth: 28 },
        7: { halign: 'center', cellWidth: 14 },
        8: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      },
      didDrawPage: () => {
        const str = `Page ${doc.internal.pages.length - 1} • Seating Arrangement • Aditya University Exam Portal`;
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    if (finalY < doc.internal.pageSize.getHeight() - 25) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Prepared By: ____________________', 14, finalY);
      doc.text('Verified By: ____________________', pageWidth / 2, finalY, { align: 'center' });
      doc.text('Controller of Examinations: ____________________', pageWidth - 14, finalY, { align: 'right' });
    }

    return doc;
  }

  // --- 4. ROOM-WISE SEATING PLAN & ABSENTEES STATEMENT ---
  public static generateRoomSeatingPlanAbsenteesPDF(
    roomAllocation: RoomAllocation,
    examination: Examination,
    session: ExamSession,
    settings: PortalSettings
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const startY = this.addUniversityHeader(
      doc,
      settings,
      'SEATING PLAN & ABSENTEES STATEMENT',
      examination.title,
      session.date,
      session.shift,
      `${session.startTime} TO ${session.endTime}`
    );

    // Room info box
    doc.setFillColor(240, 244, 250);
    doc.rect(14, startY, pageWidth - 28, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 33, 71);
    doc.text(`ROOM NO: ${roomAllocation.roomNumber} (${roomAllocation.building})`, 18, startY + 6.5);
    doc.text(`TOTAL ALLOTTED: ${roomAllocation.totalAllotted}`, 120, startY + 6.5);
    doc.text(`INVIGILATOR: ${roomAllocation.invigilator1?.facultyName || 'Dr. Assigned Faculty'} (${roomAllocation.invigilator1?.employeeId || 'AU_FAC'})`, pageWidth - 18, startY + 6.5, { align: 'right' });

    // Grid of seats (bench-wise representation)
    // 4 columns representation
    const benchesByCol: { [col: number]: typeof roomAllocation.seats } = {};
    for (const seat of roomAllocation.seats) {
      if (!benchesByCol[seat.colIndex]) benchesByCol[seat.colIndex] = [];
      benchesByCol[seat.colIndex].push(seat);
    }

    const gridHeaders = ['Row / Bench', 'Column 1', 'Column 2', 'Column 3', 'Column 4'];
    const maxRows = Math.max(...roomAllocation.seats.map(s => s.rowIndex)) + 1;
    const gridRows: any[] = [];

    for (let r = 0; r < maxRows; r++) {
      const rowItem: any[] = [`Bench ${r + 1}`];
      for (let c = 0; c < 4; c++) {
        const seatsInBench = roomAllocation.seats.filter(s => s.colIndex === c && s.rowIndex === r);
        if (seatsInBench.length > 0) {
          const seatTexts = seatsInBench.map(s => {
            if (s.isVacant || !s.rollNumber) return 'EMPTY';
            return `${s.rollNumber.slice(-4)} (S${s.semester})`;
          }).join(' | ');
          rowItem.push(seatTexts);
        } else {
          rowItem.push('—');
        }
      }
      gridRows.push(rowItem);
    }

    doc.autoTable({
      head: [gridHeaders],
      body: gridRows,
      startY: startY + 14,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [0, 33, 71],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    });

    const finalY = doc.lastAutoTable.finalY + 6;

    // Absentees Summary Table
    const summaryHeaders = [['Branch', 'Semester', 'Allotted', 'Present', 'Absent Roll Numbers', 'Total Absent']];
    const summaryRows = roomAllocation.rollNumberRanges.map(r => [
      r.branch,
      `Semester ${r.semester}`,
      r.count,
      r.count, // Default present
      'None',
      0,
    ]);

    doc.autoTable({
      head: summaryHeaders,
      body: summaryRows,
      startY: finalY,
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center' },
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
    });

    // Invigilator signature lines at bottom
    const sigY = doc.lastAutoTable.finalY + 12;
    if (sigY < doc.internal.pageSize.getHeight() - 15) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text('Signature of Invigilator-I: ____________________', 18, sigY);
      doc.text('Signature of Invigilator-II: ____________________', 130, sigY);
      doc.text('Chief Superintendent: ____________________', pageWidth - 18, sigY, { align: 'right' });
    }

    return doc;
  }

  // --- 5. OFFICIAL INVIGILATION DUTY LIST PDF ---
  public static generateInvigilationDutyListPDF(
    duties: InvigilationDuty[],
    examination: Examination,
    session: ExamSession,
    settings: PortalSettings
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const startY = this.addUniversityHeader(
      doc,
      settings,
      'INVIGILATION DUTY LIST',
      examination.title,
      session.date,
      session.shift,
      `${session.startTime} TO ${session.endTime}`
    );

    const headers = [
      ['S.No', 'Room No.', 'Building', 'Invigilator Name', 'Employee ID', 'Dept', 'Signature']
    ];

    const rows = duties.map((duty, idx) => [
      idx + 1,
      duty.roomNumber,
      duty.building.split(' ')[0],
      duty.invigilator1?.facultyName || 'Unassigned',
      duty.invigilator1?.employeeId || '—',
      duty.invigilator1?.department || '—',
      '', // Blank signature box
    ]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: startY + 6,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        textColor: [20, 20, 20],
        lineColor: [180, 190, 205],
        lineWidth: 0.2,
        valign: 'middle',
        minCellHeight: 8,
      },
      headStyles: {
        fillColor: [0, 33, 71],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'left', fontStyle: 'bold', cellWidth: 50 },
        4: { halign: 'center', cellWidth: 26 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 26 },
      },
      didDrawPage: () => {
        const str = `Page ${doc.internal.pages.length - 1} • Invigilation Duty List • Aditya University`;
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      },
    });

    const finalY = doc.lastAutoTable.finalY + 16;
    if (finalY < doc.internal.pageSize.getHeight() - 25) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Examination In-Charge', 18, finalY);
      doc.text('Controller of Examinations', pageWidth - 18, finalY, { align: 'right' });
    }

    return doc;
  }
}
