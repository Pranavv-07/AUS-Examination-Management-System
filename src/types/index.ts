export type UserRole = 'ADMIN' | 'EXAMINER';

export interface Building {
  id: string;
  code: string; // e.g. "RTB"
  name: string; // "Ramanujan Technology Bhavan"
  departmentAccess: string[]; // ["CSE", "AIML"]
  floorsCount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  assignedBuildingIds?: string[]; // IDs of buildings this examiner has permission to manage
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type AcademicYear = '1' | '2' | '3' | '4';
export type Semester = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export interface Student {
  id: string;
  rollNumber: string; // e.g. "23A91A0501"
  studentName: string;
  branch: string; // CSE, AIML, IT, ECE, EEE, MECH, CIVIL
  academicYear: AcademicYear; // '2' = 2nd year, '3' = 3rd year
  semester: Semester; // '3' = 3rd sem, '5' = 5th sem
  section: string; // 'A', 'B', 'C'
  minorStream?: string; // e.g., "Data Science Minor", "Cyber Security"
  timetableGroup?: 'T1' | 'T2' | 'T3' | 'T4';
  isEligible: boolean;
  status: 'ACTIVE' | 'DETAINED' | 'CONDONATION';
  importBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Faculty {
  id: string;
  employeeId: string; // Unique e.g. "AU_FAC_101"
  facultyName: string;
  department: string; // CSE, ECE, etc.
  designation: string; // Assistant Professor, Associate Professor, Professor
  email?: string;
  phone?: string;
  isActive: boolean;
  totalDutiesCompleted: number;
  maxDutiesPerSession?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  code: string; // CSE
  name: string; // Computer Science & Engineering
  branches: string[];
  hodName?: string;
}

export interface SeatConfig {
  seatIndex: number; // 0, 1, 2 for a 3-seat bench
  targetGroup: '3' | '5' | 'ANY' | 'BLOCKED'; // '3' = 3rd sem / 2nd yr, '5' = 5th sem / 3rd yr
  isBlocked: boolean;
  notes?: string;
}

export interface BenchConfig {
  benchId: string;
  colIndex: number; // Column index (0, 1, 2, 3...)
  rowIndex: number; // Row index (0, 1, 2, 3...)
  benchNumber: number; // 1, 2, 3...
  seatsCount: number; // Default 3
  seats: SeatConfig[]; // 3 seats
}

export interface RoomLayoutConfig {
  columnsCount: number;
  benchesPerColumn: number[]; // Array of bench count per column e.g. [6, 6, 6, 6]
  seatsPerBenchDefault: number; // 3
  benches: BenchConfig[];
  aislePositions?: number[]; // Column indices where aisle is placed
  revision: number;
  notes?: string;
}

export interface Room {
  id: string;
  buildingId?: string;
  roomNumber: string; // e.g. "RTB 201", "RTB 202", "JWB 101"
  building: string; // "Ramanujan Tech Bhavan (RTB)", "James Watt Bhavan (JWB)", "Cotton Bhavan"
  floor: string; // "Ground Floor", "1st Floor", "2nd Floor"
  roomType: 'Regular Classroom' | 'Drawing Hall' | 'Seminar Hall' | 'Lab';
  columnsCount: number;
  rowsCount: number;
  totalCapacity: number; // Calculated from active seats
  usableCapacity: number;
  blockedSeatsCount: number;
  isActive: boolean;
  layoutRevision: number;
  layout: RoomLayoutConfig;
  createdAt: string;
  updatedAt: string;
}

export type ExamShift = 'FN' | 'AN';

export interface SubjectSlot {
  id: string;
  subjectCode: string; // e.g. "23CS301"
  subjectName: string; // e.g. "Data Structures"
  branch: string; // CSE
  academicYear: AcademicYear;
  semester: Semester;
  regulation: string; // AR23, AR20
  timetableCategory?: 'T1' | 'T2' | 'T3' | 'T4';
  eligibleStudentCount?: number;
}

export interface ExamSession {
  id: string;
  examinationId: string;
  date: string; // YYYY-MM-DD
  shift: ExamShift; // FN = 09:30 AM - 12:30 PM, AN = 01:30 PM - 04:30 PM
  startTime: string; // "09:30 AM"
  endTime: string; // "12:30 PM"
  subjects: SubjectSlot[];
  status: 'SCHEDULED' | 'SEATING_GENERATED' | 'ATTENDANCE_RECORDED' | 'COMPLETED';
}

export interface Examination {
  id: string;
  code: string; // e.g. "AU-EXAM-OCT-2026-01"
  title: string; // e.g. "B.Tech III & V Semester End Regular Examinations - October 2026"
  academicYear: string; // "2026-2027"
  semesterPattern: '3 & 5' | '3 only' | '5 only' | 'All';
  examType: 'End Semester Regular' | 'Supplementary' | 'Mid Term' | 'Practical';
  department: string; // "All Engineering Departments" or specific
  regulation: string; // "AR23 / AR20"
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'TIMETABLE_READY' | 'SEATING_FINALIZED' | 'ATTENDANCE_RECORDED' | 'ARCHIVED';
  sessions: ExamSession[];
  availableRoomIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SeatAllocation {
  benchId: string;
  colIndex: number;
  rowIndex: number;
  seatIndex: number; // 0, 1, 2
  benchNumber: number;
  seatLabel: string; // e.g. "B1-S1"
  studentId: string;
  rollNumber: string;
  studentName: string;
  branch: string;
  academicYear: AcademicYear;
  semester: Semester;
  section: string;
  subjectCode: string;
  subjectName: string;
  timetableGroup?: 'T1' | 'T2' | 'T3' | 'T4';
  isVacant?: boolean;
}

export interface RollNumberRange {
  branch: string;
  semester: Semester;
  academicYear: AcademicYear;
  fromRoll: string;
  toRoll: string;
  count: number;
  timetableGroup?: string;
  subjectName?: string;
}

export interface RoomAllocation {
  roomId: string;
  roomNumber: string;
  building: string;
  floor: string;
  totalAllotted: number;
  usableCapacity: number;
  rollNumberRanges: RollNumberRange[];
  seats: SeatAllocation[];
  invigilator1?: {
    facultyId: string;
    employeeId: string;
    facultyName: string;
    department: string;
  };
  invigilator2?: {
    facultyId: string;
    employeeId: string;
    facultyName: string;
    department: string;
  };
}

export interface SeatingArrangement {
  id: string;
  examinationId: string;
  sessionId: string;
  date: string;
  shift: ExamShift;
  roomAllocations: RoomAllocation[];
  totalStudentsAllocated: number;
  totalRoomsUsed: number;
  shortageCount: number;
  shortageReasons?: string[];
  status: 'DRAFT' | 'FINALIZED';
  generatedAt: string;
  finalizedAt?: string;
  finalizedBy?: string;
  revision: number;
}

export type AvailabilityStatus = 'YES' | 'NO' | 'UNANSWERED';

export interface FacultyAvailability {
  id: string;
  facultyId: string;
  employeeId: string;
  facultyName: string;
  department: string;
  examinationId: string;
  sessionId: string;
  date: string;
  shift: ExamShift;
  status: AvailabilityStatus;
  remarks?: string;
  updatedAt: string;
}

export interface InvigilationDuty {
  id: string;
  examinationId: string;
  sessionId: string;
  date: string;
  shift: ExamShift;
  roomId: string;
  roomNumber: string;
  building: string;
  invigilator1: {
    facultyId: string;
    employeeId: string;
    facultyName: string;
    department: string;
  };
  invigilator2?: {
    facultyId: string;
    employeeId: string;
    facultyName: string;
    department: string;
  };
  status: 'DRAFT' | 'LOCKED' | 'FINALIZED';
  generatedAt: string;
  finalizedAt?: string;
  revision: number;
}

export interface StudentAttendanceEntry {
  sNo: number;
  studentId: string;
  rollNumber: string;
  studentName: string;
  branch: string;
  semester: Semester;
  subjectCode: string;
  subjectName: string;
  answerBookletNo: string; // Blank space for manual entry by exam hall invigilator
  studentSignature: string; // Space for manual student sign
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'UNMARKED';
}

export interface RoomAttendanceRecord {
  id: string;
  examinationId: string;
  sessionId: string;
  roomId: string;
  roomNumber: string;
  building: string;
  date: string;
  shift: ExamShift;
  timings: string; // "09:30 AM TO 12:30 PM"
  subjectTitle: string;
  department: string;
  totalAllotted: number;
  totalPresent: number;
  totalAbsent: number;
  totalUnmarked: number;
  students: StudentAttendanceEntry[];
  invigilator1Name?: string;
  invigilator1EmpId?: string;
  invigilator2Name?: string;
  invigilator2EmpId?: string;
  chiefSuperintendentSigned?: boolean;
  generatedAt: string;
  updatedAt: string;
}

export interface GeneratedDocument {
  id: string;
  examinationId: string;
  sessionId?: string;
  roomId?: string;
  documentType:
    | 'SEATING_ARRANGEMENT_SUMMARY'
    | 'STUDENT_ATTENDANCE_SHEET'
    | 'ROOM_SEATING_PLAN_ABSENTEES'
    | 'INVIGILATION_DUTY_LIST'
    | 'EXAM_TIMETABLE'
    | 'BULK_ATTENDANCE_ZIP';
  fileName: string;
  fileFormat: 'PDF' | 'XLSX' | 'ZIP' | 'CSV';
  fileSizeKb: number;
  generatedAt: string;
  generatedBy: string;
  downloadCount: number;
  metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
  };
  action: string;
  module: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
}

export interface PortalSettings {
  universityName: string;
  universityAddress: string;
  examinationBranch: string;
  accreditationText: string;
  logoUrl?: string;
  seatsPerBenchDefault: number;
  defaultMixingPattern: '3-5-3' | '5-3-5' | 'CONTINUOUS_YEAR';
  invigilatorsPerRoom: number;
  maxDutiesPerFaculty: number;
  autoBalanceDepartments: boolean;
  mongoConnectionUri?: string;
  mongoDatabaseName?: string;
}
