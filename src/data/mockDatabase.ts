import {
  User,
  Student,
  Faculty,
  Department,
  Building,
  Room,
  Examination,
  PortalSettings,
  AuditLog,
} from '../types';

export const INITIAL_SETTINGS: PortalSettings = {
  universityName: 'ADITYA UNIVERSITY',
  universityAddress: 'Aditya Nagar, ADB Road, Surampalem, Kakinada District, Andhra Pradesh - 533437',
  examinationBranch: 'EXAMINATION SECTION — OFFICE OF THE CONTROLLER OF EXAMINATIONS',
  accreditationText: 'Approved by AICTE, Accredited by NAAC with A++ Grade, Recognized by UGC',
  logoUrl: '/aditya-university-logo.svg',
  seatsPerBenchDefault: 3,
  defaultMixingPattern: '3-5-3',
  invigilatorsPerRoom: 1,
  maxDutiesPerFaculty: 4,
  autoBalanceDepartments: true,
  mongoConnectionUri: 'mongodb+srv://au_exam_user:••••••••@cluster0.mongodb.net/aditya_exam_portal?retryWrites=true&w=majority',
  mongoDatabaseName: 'aditya_exam_portal',
};

// Exactly 2 bootstrap logins as requested:
// 1. admin / admin123
// 2. examiner / examiner123 (assigned to CSE branch & RTB building block)
export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    name: 'Chief Controller of Examinations',
    email: 'coe@adityauniversity.in',
    role: 'ADMIN',
    department: 'Examination Section',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_examiner',
    username: 'examiner',
    name: 'Dr. K. S. Rama Krishna',
    email: 'examiner.cse@adityauniversity.in',
    role: 'EXAMINER',
    department: 'CSE',
    assignedBuildingIds: ['bld_rtb', 'bld_cb'], // Permitted access to RTB (CSE block) & Cotton Bhavan
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

// Initial Buildings created and managed by Admin
export const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'bld_rtb',
    code: 'RTB',
    name: 'Ramanujan Technology Bhavan',
    departmentAccess: ['CSE', 'AIML', 'IT'],
    floorsCount: 4,
    description: 'Main Computing Block housing Computer Science and Information Technology branches',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'bld_jwb',
    code: 'JWB',
    name: 'James Watt Bhavan',
    departmentAccess: ['MECH', 'CIVIL'],
    floorsCount: 3,
    description: 'Mechanical and Civil Engineering Block',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'bld_cb',
    code: 'CB',
    name: 'Sir Arthur Cotton Bhavan',
    departmentAccess: ['CSE', 'ECE', 'CIVIL'],
    floorsCount: 4,
    description: 'Central Examination and Drawing Halls block',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'bld_klr',
    code: 'KLRB',
    name: 'KL Rao Bhavan',
    departmentAccess: ['EEE', 'ECE'],
    floorsCount: 4,
    description: 'Electrical and Electronics Engineering Complex',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept_cse',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    branches: ['CSE', 'AIML', 'Data Science', 'IT'],
    hodName: 'Dr. M. Sreenivasa Rao',
  },
  {
    id: 'dept_ece',
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    branches: ['ECE', 'IoT'],
    hodName: 'Dr. G. Rama Krishna',
  },
  {
    id: 'dept_eee',
    code: 'EEE',
    name: 'Electrical and Electronics Engineering',
    branches: ['EEE'],
    hodName: 'Dr. K. V. S. Ramachandra Murthy',
  },
  {
    id: 'dept_mech',
    code: 'MECH',
    name: 'Mechanical Engineering',
    branches: ['MECH', 'Robotics'],
    hodName: 'Dr. Pritam Das',
  },
  {
    id: 'dept_civil',
    code: 'CIVIL',
    name: 'Civil Engineering',
    branches: ['CIVIL'],
    hodName: 'Dr. S. Govinda Rao',
  },
];

// As explicitly requested: "dont keep any faculty, student or exams data at all - keep everything blank"
// Everything starts clean and blank so user enters or imports their authentic data:
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_FACULTY: Faculty[] = [];
export const INITIAL_EXAMINATIONS: Examination[] = [];
export const INITIAL_ROOMS: Room[] = [];

export function generateInitialStudents(): Student[] {
  return [];
}

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_init',
    timestamp: new Date().toISOString(),
    actor: {
      id: 'usr_admin',
      username: 'admin',
      name: 'Chief Controller of Examinations',
      role: 'ADMIN',
    },
    action: 'SYSTEM_INITIALIZED',
    module: 'Portal Core',
    details: 'Aditya University Examination Management Portal initialized with clean database schema.',
    ipAddress: '10.10.1.45',
  },
];
