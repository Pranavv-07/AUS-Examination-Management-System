import {
  User,
  Student,
  Faculty,
  Department,
  Building,
  Room,
  Examination,
  SeatingArrangement,
  InvigilationDuty,
  FacultyAvailability,
  RoomAttendanceRecord,
  GeneratedDocument,
  AuditLog,
  PortalSettings,
  ExamSession,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_BUILDINGS,
  INITIAL_ROOMS,
  INITIAL_STUDENTS,
  INITIAL_FACULTY,
  INITIAL_EXAMINATIONS,
  INITIAL_AUDIT_LOGS,
  generateInitialStudents,
} from '../data/mockDatabase';

const STORAGE_KEYS = {
  USERS: 'au_portal_users_v3',
  STUDENTS: 'au_portal_students_v3',
  FACULTY: 'au_portal_faculty_v3',
  DEPARTMENTS: 'au_portal_departments_v3',
  BUILDINGS: 'au_portal_buildings_v3',
  ROOMS: 'au_portal_rooms_v3',
  EXAMINATIONS: 'au_portal_examinations_v3',
  SEATING: 'au_portal_seating_v3',
  DUTIES: 'au_portal_duties_v3',
  AVAILABILITY: 'au_portal_availability_v3',
  ATTENDANCE: 'au_portal_attendance_v3',
  DOCUMENTS: 'au_portal_documents_v3',
  AUDIT_LOGS: 'au_portal_audit_logs_v3',
  SETTINGS: 'au_portal_settings_v3',
  CURRENT_USER: 'au_portal_current_user_v3',
};

class DatabaseService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to persist key ${key} to storage`, e);
    }
  }

  public init() {
    // Purge old v2 mock keys if present to ensure 100% clean blank state
    try {
      ['au_portal_students_v2', 'au_portal_faculty_v2', 'au_portal_examinations_v2', 'au_portal_seating_v2'].forEach(k => {
        localStorage.removeItem(k);
      });
    } catch {}

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      this.set(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FACULTY)) {
      this.set(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      this.set(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BUILDINGS)) {
      this.set(STORAGE_KEYS.BUILDINGS, INITIAL_BUILDINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
      this.set(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAMINATIONS)) {
      this.set(STORAGE_KEYS.EXAMINATIONS, INITIAL_EXAMINATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]); // Default to Admin
    }
  }

  // --- Current User & Auth ---
  public getCurrentUser(): User {
    return this.get<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }

  public setCurrentUser(user: User): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
    this.logAudit('USER_LOGIN', 'Authentication', `User ${user.username} (${user.role}) switched active session`);
  }

  public login(username: string, pass: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanUser = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === cleanUser);
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }
    if (!user.isActive) {
      return { success: false, error: 'This user account is currently deactivated. Contact Admin.' };
    }

    // Default bootstrap check or demo check
    const valid = (cleanUser === 'admin' && pass === 'admin123') ||
                  (cleanUser === 'examiner' && pass === 'examiner123') ||
                  (cleanUser === 'examiner_ece' && pass === 'examiner123') ||
                  (pass === 'admin123' || pass === 'examiner123' || pass === 'password123');

    if (!valid) {
      return { success: false, error: 'Invalid username or password' };
    }

    const updatedUser: User = {
      ...user,
      lastLogin: new Date().toISOString(),
    };
    this.saveUser(updatedUser);
    this.setCurrentUser(updatedUser);
    this.logAudit('USER_LOGIN', 'Authentication', `User ${user.username} successfully logged in`);
    return { success: true, user: updatedUser };
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public logAudit(action: string, module: string, details: string, entityId?: string): void {
    const logs = this.getAuditLogs();
    const currentUser = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role,
      },
      action,
      module,
      entityId,
      details,
      ipAddress: '10.10.1.45',
    };
    logs.unshift(newLog);
    // Keep last 1000 logs
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 1000));
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.set(STORAGE_KEYS.USERS, users);
    this.logAudit('USER_UPSERT', 'User Management', `User account ${user.username} (${user.role}) saved`, user.id);
  }

  public deleteUser(userId: string): void {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (target?.username === 'admin') {
      throw new Error('Default bootstrap admin account cannot be deleted');
    }
    this.set(STORAGE_KEYS.USERS, users.filter(u => u.id !== userId));
    this.logAudit('USER_DELETED', 'User Management', `Deleted user account: ${target?.username}`, userId);
  }

  // --- Students ---
  public getStudents(): Student[] {
    return this.get<Student[]>(STORAGE_KEYS.STUDENTS, []);
  }

  public saveStudent(student: Student): void {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === student.id || s.rollNumber.toUpperCase() === student.rollNumber.toUpperCase());
    if (index >= 0) {
      students[index] = { ...student, updatedAt: new Date().toISOString() };
    } else {
      students.push({
        ...student,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.set(STORAGE_KEYS.STUDENTS, students);
  }

  public bulkUpsertStudents(newStudents: Student[], batchName = 'Bulk Import'): { added: number; updated: number } {
    const students = this.getStudents();
    let added = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const ns of newStudents) {
      const idx = students.findIndex(s => s.rollNumber.toUpperCase() === ns.rollNumber.toUpperCase());
      if (idx >= 0) {
        students[idx] = { ...students[idx], ...ns, updatedAt: now };
        updated++;
      } else {
        students.push({ ...ns, id: ns.id || `std_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: now, updatedAt: now });
        added++;
      }
    }
    this.set(STORAGE_KEYS.STUDENTS, students);
    this.logAudit('STUDENTS_BULK_IMPORT', 'Student Management', `${batchName}: Added ${added}, Updated ${updated} student records`);
    return { added, updated };
  }

  public deleteStudent(studentId: string): void {
    const students = this.getStudents();
    const s = students.find(item => item.id === studentId);
    this.set(STORAGE_KEYS.STUDENTS, students.filter(item => item.id !== studentId));
    this.logAudit('STUDENT_DELETED', 'Student Management', `Removed student ${s?.rollNumber} (${s?.studentName})`, studentId);
  }

  // --- Faculty ---
  public getFaculty(): Faculty[] {
    return this.get<Faculty[]>(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
  }

  public saveFaculty(fac: Faculty): void {
    const faculty = this.getFaculty();
    const index = faculty.findIndex(f => f.id === fac.id || f.employeeId.toUpperCase() === fac.employeeId.toUpperCase());
    if (index >= 0) {
      faculty[index] = { ...fac, updatedAt: new Date().toISOString() };
    } else {
      faculty.push({ ...fac, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.set(STORAGE_KEYS.FACULTY, faculty);
  }

  public bulkUpsertFaculty(newFaculty: Faculty[], batchName = 'Faculty Import'): { added: number; updated: number } {
    const faculty = this.getFaculty();
    let added = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const nf of newFaculty) {
      const idx = faculty.findIndex(f => f.employeeId.toUpperCase() === nf.employeeId.toUpperCase());
      if (idx >= 0) {
        faculty[idx] = { ...faculty[idx], ...nf, updatedAt: now };
        updated++;
      } else {
        faculty.push({ ...nf, id: nf.id || `fac_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: now, updatedAt: now });
        added++;
      }
    }
    this.set(STORAGE_KEYS.FACULTY, faculty);
    this.logAudit('FACULTY_BULK_IMPORT', 'Faculty Management', `${batchName}: Added ${added}, Updated ${updated} faculty records`);
    return { added, updated };
  }

  public deleteFaculty(facultyId: string): void {
    const faculty = this.getFaculty();
    const f = faculty.find(item => item.id === facultyId);
    this.set(STORAGE_KEYS.FACULTY, faculty.filter(item => item.id !== facultyId));
    this.logAudit('FACULTY_DELETED', 'Faculty Management', `Removed faculty member ${f?.facultyName} (${f?.employeeId})`, facultyId);
  }

  // --- Departments ---
  public getDepartments(): Department[] {
    return this.get<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  public saveDepartment(dept: Department): void {
    const depts = this.getDepartments();
    const index = depts.findIndex(d => d.id === dept.id);
    if (index >= 0) {
      depts[index] = dept;
    } else {
      depts.push(dept);
    }
    this.set(STORAGE_KEYS.DEPARTMENTS, depts);
  }

  // --- Buildings (Admin managed) ---
  public getBuildings(): Building[] {
    return this.get<Building[]>(STORAGE_KEYS.BUILDINGS, INITIAL_BUILDINGS);
  }

  public getBuildingById(id: string): Building | undefined {
    return this.getBuildings().find(b => b.id === id);
  }

  public saveBuilding(building: Building): void {
    const buildings = this.getBuildings();
    const index = buildings.findIndex(b => b.id === building.id);
    const now = new Date().toISOString();
    if (index >= 0) {
      buildings[index] = { ...building, updatedAt: now };
    } else {
      buildings.push({ ...building, createdAt: now, updatedAt: now });
    }
    this.set(STORAGE_KEYS.BUILDINGS, buildings);
    this.logAudit('BUILDING_SAVED', 'Building Management', `Building ${building.name} (${building.code}) saved by Admin`, building.id);
  }

  public deleteBuilding(buildingId: string): void {
    const buildings = this.getBuildings();
    const target = buildings.find(b => b.id === buildingId);
    this.set(STORAGE_KEYS.BUILDINGS, buildings.filter(b => b.id !== buildingId));
    this.logAudit('BUILDING_DELETED', 'Building Management', `Deleted building: ${target?.name} (${target?.code})`, buildingId);
  }

  // --- Rooms & Layouts ---
  public getRooms(): Room[] {
    return this.get<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
  }

  public getRoomById(id: string): Room | undefined {
    return this.getRooms().find(r => r.id === id);
  }

  public saveRoom(room: Room): void {
    const rooms = this.getRooms();
    const index = rooms.findIndex(r => r.id === room.id);
    const now = new Date().toISOString();
    if (index >= 0) {
      rooms[index] = { ...room, updatedAt: now };
    } else {
      rooms.push({ ...room, createdAt: now, updatedAt: now });
    }
    this.set(STORAGE_KEYS.ROOMS, rooms);
    this.logAudit('ROOM_LAYOUT_SAVED', 'Room Management', `Saved layout revision #${room.layoutRevision} for Room ${room.roomNumber} (Usable Cap: ${room.usableCapacity})`, room.id);
  }

  public deleteRoom(roomId: string): void {
    const rooms = this.getRooms();
    const r = rooms.find(item => item.id === roomId);
    this.set(STORAGE_KEYS.ROOMS, rooms.filter(item => item.id !== roomId));
    this.logAudit('ROOM_DELETED', 'Room Management', `Deleted room ${r?.roomNumber} from database`, roomId);
  }

  // --- Examinations & Timetables ---
  public getExaminations(): Examination[] {
    return this.get<Examination[]>(STORAGE_KEYS.EXAMINATIONS, INITIAL_EXAMINATIONS);
  }

  public getExaminationById(id: string): Examination | undefined {
    return this.getExaminations().find(e => e.id === id);
  }

  public saveExamination(exam: Examination): void {
    const exams = this.getExaminations();
    const index = exams.findIndex(e => e.id === exam.id);
    const now = new Date().toISOString();
    if (index >= 0) {
      exams[index] = { ...exam, updatedAt: now };
    } else {
      exams.push({ ...exam, createdAt: now, updatedAt: now });
    }
    this.set(STORAGE_KEYS.EXAMINATIONS, exams);
    this.logAudit('EXAM_UPSERT', 'Examination Management', `Saved examination ${exam.title} (${exam.code})`, exam.id);
  }

  public deleteExamination(examId: string): void {
    const exams = this.getExaminations();
    const e = exams.find(item => item.id === examId);
    this.set(STORAGE_KEYS.EXAMINATIONS, exams.filter(item => item.id !== examId));
    this.logAudit('EXAM_DELETED', 'Examination Management', `Deleted examination ${e?.title}`, examId);
  }

  // --- Seating Arrangements ---
  public getSeatingArrangements(): SeatingArrangement[] {
    return this.get<SeatingArrangement[]>(STORAGE_KEYS.SEATING, []);
  }

  public getSeatingArrangement(sessionId: string): SeatingArrangement | undefined {
    return this.getSeatingArrangements().find(s => s.sessionId === sessionId);
  }

  public saveSeatingArrangement(seating: SeatingArrangement): void {
    const seatings = this.getSeatingArrangements();
    const index = seatings.findIndex(s => s.sessionId === seating.sessionId);
    if (index >= 0) {
      seatings[index] = seating;
    } else {
      seatings.push(seating);
    }
    this.set(STORAGE_KEYS.SEATING, seatings);

    // Sync examination session status
    const exams = this.getExaminations();
    const exam = exams.find(e => e.id === seating.examinationId);
    if (exam) {
      const sess = exam.sessions.find(s => s.id === seating.sessionId);
      if (sess) {
        sess.status = 'SEATING_GENERATED';
        this.saveExamination(exam);
      }
    }

    this.logAudit(
      'SEATING_SAVED',
      'Seating Generator',
      `Seating plan for session ${seating.date} (${seating.shift}) saved. Allotted ${seating.totalStudentsAllocated} students in ${seating.totalRoomsUsed} rooms`,
      seating.id
    );
  }

  // --- Faculty Availability ---
  public getFacultyAvailability(sessionId?: string): FacultyAvailability[] {
    const all = this.get<FacultyAvailability[]>(STORAGE_KEYS.AVAILABILITY, []);
    return sessionId ? all.filter(a => a.sessionId === sessionId) : all;
  }

  public saveFacultyAvailability(record: FacultyAvailability): void {
    const all = this.getFacultyAvailability();
    const idx = all.findIndex(a => a.sessionId === record.sessionId && a.facultyId === record.facultyId);
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    this.set(STORAGE_KEYS.AVAILABILITY, all);
  }

  public bulkSaveFacultyAvailability(records: FacultyAvailability[]): void {
    const all = this.getFacultyAvailability();
    for (const rec of records) {
      const idx = all.findIndex(a => a.sessionId === rec.sessionId && a.facultyId === rec.facultyId);
      if (idx >= 0) {
        all[idx] = rec;
      } else {
        all.push(rec);
      }
    }
    this.set(STORAGE_KEYS.AVAILABILITY, all);
  }

  // --- Invigilation Duties ---
  public getInvigilationDuties(sessionId?: string): InvigilationDuty[] {
    const all = this.get<InvigilationDuty[]>(STORAGE_KEYS.DUTIES, []);
    return sessionId ? all.filter(d => d.sessionId === sessionId) : all;
  }

  public saveInvigilationDuties(duties: InvigilationDuty[]): void {
    const all = this.get<InvigilationDuty[]>(STORAGE_KEYS.DUTIES, []);
    const sessionIds = Array.from(new Set(duties.map(d => d.sessionId)));
    const filtered = all.filter(d => !sessionIds.includes(d.sessionId));
    filtered.push(...duties);
    this.set(STORAGE_KEYS.DUTIES, filtered);
    this.logAudit('INVIGILATION_DUTIES_SAVED', 'Invigilation Generator', `Saved ${duties.length} room invigilation assignments`);
  }

  // --- Student Attendance Sheets & Records ---
  public getAttendanceRecords(sessionId?: string): RoomAttendanceRecord[] {
    const all = this.get<RoomAttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    return sessionId ? all.filter(a => a.sessionId === sessionId) : all;
  }

  public saveAttendanceRecord(record: RoomAttendanceRecord): void {
    const all = this.get<RoomAttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const idx = all.findIndex(a => a.sessionId === record.sessionId && a.roomId === record.roomId);
    if (idx >= 0) {
      all[idx] = { ...record, updatedAt: new Date().toISOString() };
    } else {
      all.push({ ...record, generatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.set(STORAGE_KEYS.ATTENDANCE, all);
    this.logAudit('ATTENDANCE_RECORD_UPDATED', 'Attendance Management', `Attendance updated for Room ${record.roomNumber}: ${record.totalPresent} Present, ${record.totalAbsent} Absent`);
  }

  // --- Generated Documents Registry ---
  public getGeneratedDocuments(): GeneratedDocument[] {
    return this.get<GeneratedDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
  }

  public recordGeneratedDocument(doc: GeneratedDocument): void {
    const docs = this.getGeneratedDocuments();
    docs.unshift(doc);
    this.set(STORAGE_KEYS.DOCUMENTS, docs);
    this.logAudit('DOCUMENT_GENERATED', 'Document Hub', `Generated ${doc.documentType} file: ${doc.fileName} (${doc.fileFormat})`);
  }

  // --- Portal Settings ---
  public getSettings(): PortalSettings {
    return this.get<PortalSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public saveSettings(settings: PortalSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    this.logAudit('SETTINGS_UPDATED', 'Portal Settings', 'Updated portal configuration & institutional parameters');
  }

  // --- Factory Reset & Export/Import DB ---
  public factoryReset(): void {
    localStorage.clear();
    this.init();
    this.logAudit('SYSTEM_FACTORY_RESET', 'System', 'Reset all database records to fresh Aditya University bootstrap state');
  }

  public exportEntireDatabase(): string {
    const dump = {
      users: this.getUsers(),
      students: this.getStudents(),
      faculty: this.getFaculty(),
      departments: this.getDepartments(),
      buildings: this.getBuildings(),
      rooms: this.getRooms(),
      examinations: this.getExaminations(),
      seating: this.getSeatingArrangements(),
      duties: this.getInvigilationDuties(),
      availability: this.getFacultyAvailability(),
      attendance: this.getAttendanceRecords(),
      documents: this.getGeneratedDocuments(),
      settings: this.getSettings(),
      auditLogs: this.getAuditLogs(),
      timestamp: new Date().toISOString(),
      institution: 'Aditya University, Surampalem',
    };
    return JSON.stringify(dump, null, 2);
  }

  public importEntireDatabase(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.users) this.set(STORAGE_KEYS.USERS, parsed.users);
      if (parsed.students) this.set(STORAGE_KEYS.STUDENTS, parsed.students);
      if (parsed.faculty) this.set(STORAGE_KEYS.FACULTY, parsed.faculty);
      if (parsed.departments) this.set(STORAGE_KEYS.DEPARTMENTS, parsed.departments);
      if (parsed.buildings) this.set(STORAGE_KEYS.BUILDINGS, parsed.buildings);
      if (parsed.rooms) this.set(STORAGE_KEYS.ROOMS, parsed.rooms);
      if (parsed.examinations) this.set(STORAGE_KEYS.EXAMINATIONS, parsed.examinations);
      if (parsed.seating) this.set(STORAGE_KEYS.SEATING, parsed.seating);
      if (parsed.duties) this.set(STORAGE_KEYS.DUTIES, parsed.duties);
      if (parsed.availability) this.set(STORAGE_KEYS.AVAILABILITY, parsed.availability);
      if (parsed.attendance) this.set(STORAGE_KEYS.ATTENDANCE, parsed.attendance);
      if (parsed.documents) this.set(STORAGE_KEYS.DOCUMENTS, parsed.documents);
      if (parsed.settings) this.set(STORAGE_KEYS.SETTINGS, parsed.settings);
      this.logAudit('DATABASE_RESTORED', 'System', 'Restored database from external JSON backup snapshot');
      return true;
    } catch (e) {
      console.error('Failed to parse database backup', e);
      return false;
    }
  }
}

export const db = new DatabaseService();
db.init();
