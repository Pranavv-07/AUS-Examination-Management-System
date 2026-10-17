import mongoose, { Schema } from 'mongoose';

// User Schema
const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'EXAMINER'], required: true },
    department: { type: String },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Student Schema
const StudentSchema = new Schema(
  {
    rollNumber: { type: String, required: true, unique: true, index: true },
    studentName: { type: String, required: true },
    branch: { type: String, required: true, index: true },
    academicYear: { type: String, enum: ['1', '2', '3', '4'], required: true, index: true },
    semester: { type: String, enum: ['1', '2', '3', '4', '5', '6', '7', '8'], required: true, index: true },
    section: { type: String, default: 'A' },
    minorStream: { type: String },
    timetableGroup: { type: String, enum: ['T1', 'T2', 'T3', 'T4'] },
    isEligible: { type: Boolean, default: true },
    status: { type: String, enum: ['ACTIVE', 'DETAINED', 'CONDONATION'], default: 'ACTIVE' },
    importBatchId: { type: String },
  },
  { timestamps: true }
);

// Faculty Schema
const FacultySchema = new Schema(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    facultyName: { type: String, required: true },
    department: { type: String, required: true, index: true },
    designation: { type: String, default: 'Assistant Professor' },
    email: { type: String },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    totalDutiesCompleted: { type: Number, default: 0 },
    maxDutiesPerSession: { type: Number, default: 4 },
  },
  { timestamps: true }
);

// Room Schema
const RoomSchema = new Schema(
  {
    roomNumber: { type: String, required: true, unique: true, index: true },
    building: { type: String, required: true },
    floor: { type: String, required: true },
    roomType: { type: String, default: 'Regular Classroom' },
    columnsCount: { type: Number, required: true },
    rowsCount: { type: Number, required: true },
    totalCapacity: { type: Number, required: true },
    usableCapacity: { type: Number, required: true },
    blockedSeatsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    layoutRevision: { type: Number, default: 1 },
    layout: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Examination Schema
const ExaminationSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    academicYear: { type: String, required: true },
    semesterPattern: { type: String, default: '3 & 5' },
    examType: { type: String, default: 'End Semester Regular' },
    department: { type: String, default: 'All Engineering Departments' },
    regulation: { type: String, default: 'AR23 / AR20' },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: { type: String, default: 'DRAFT', index: true },
    sessions: [
      {
        id: String,
        date: String,
        shift: { type: String, enum: ['FN', 'AN'] },
        startTime: String,
        endTime: String,
        status: String,
        subjects: [
          {
            id: String,
            subjectCode: String,
            subjectName: String,
            branch: String,
            academicYear: String,
            semester: String,
            regulation: String,
            timetableCategory: String,
            eligibleStudentCount: Number,
          },
        ],
      },
    ],
    availableRoomIds: [{ type: String }],
    createdBy: { type: String },
  },
  { timestamps: true }
);

// Seating Arrangement Schema
const SeatingArrangementSchema = new Schema(
  {
    examinationId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    shift: { type: String, required: true },
    roomAllocations: [Schema.Types.Mixed],
    totalStudentsAllocated: { type: Number, required: true },
    totalRoomsUsed: { type: Number, required: true },
    shortageCount: { type: Number, default: 0 },
    shortageReasons: [String],
    status: { type: String, default: 'DRAFT' },
    generatedAt: { type: Date, default: Date.now },
    finalizedAt: { type: Date },
    finalizedBy: { type: String },
    revision: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Invigilation Duty Schema
const InvigilationDutySchema = new Schema(
  {
    examinationId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    shift: { type: String, required: true },
    roomId: { type: String, required: true },
    roomNumber: { type: String, required: true },
    building: { type: String },
    invigilator1: Schema.Types.Mixed,
    invigilator2: Schema.Types.Mixed,
    status: { type: String, default: 'DRAFT' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Audit Log Schema
const AuditLogSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    actor: {
      id: String,
      username: String,
      name: String,
      role: String,
    },
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    entityId: { type: String },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: false }
);

// Export Mongoose models
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const StudentModel = mongoose.models.Student || mongoose.model('Student', StudentSchema);
export const FacultyModel = mongoose.models.Faculty || mongoose.model('Faculty', FacultySchema);
export const RoomModel = mongoose.models.Room || mongoose.model('Room', RoomSchema);
export const ExaminationModel = mongoose.models.Examination || mongoose.model('Examination', ExaminationSchema);
export const SeatingModel = mongoose.models.Seating || mongoose.model('Seating', SeatingArrangementSchema);
export const InvigilationModel = mongoose.models.Invigilation || mongoose.model('Invigilation', InvigilationDutySchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
