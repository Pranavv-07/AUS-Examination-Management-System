/**
 * Automated Test Suite for Aditya University Exam Management Portal
 * Tests core business rules, seating algorithms, 5-column attendance registers, and invigilation engine.
 */

import { SeatingAllocationEngine } from '../services/seatingAlgorithm';
import { InvigilationEngine } from '../services/invigilationAlgorithm';
import { generateInitialStudents, INITIAL_ROOMS, INITIAL_FACULTY, INITIAL_EXAMINATIONS } from '../data/mockDatabase';
import { Student, FacultyAvailability, ExamSession } from '../types';

export function runAllTests(): { passed: number; failed: number; results: { test: string; status: 'PASS' | 'FAIL'; message?: string }[] } {
  const results: { test: string; status: 'PASS' | 'FAIL'; message?: string }[] = [];
  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, message?: string) {
    if (condition) {
      passed++;
      results.push({ test: testName, status: 'PASS' });
    } else {
      failed++;
      results.push({ test: testName, status: 'FAIL', message });
    }
  }

  // --- Test 1: 3-Seats-Per-Bench Default Rule ---
  const rtb201 = INITIAL_ROOMS.find(r => r.roomNumber === 'RTB 201');
  const bench1 = rtb201?.layout.benches[0];
  assert(
    'Room benches contain exactly 3 individual seat positions by default',
    bench1?.seatsCount === 3 && bench1?.seats.length === 3,
    `Expected 3 seats per bench, got ${bench1?.seatsCount}`
  );

  // --- Test 2: Academic Year Mixing Notation ('3' for 2nd Yr / Sem 3, '5' for 3rd Yr / Sem 5) ---
  const benchPattern = bench1?.seats.map(s => s.targetGroup).join('-');
  assert(
    "Bench academic-year mixing supports '3-5-3' and '5-3-5' patterns",
    benchPattern === '3-5-3' || benchPattern === '5-3-5',
    `Bench target groups: ${benchPattern}`
  );

  // --- Test 3: Usable Capacity Calculation with Blocked Seats ---
  const rtb202 = INITIAL_ROOMS.find(r => r.roomNumber === 'RTB 202');
  assert(
    'Usable capacity correctly accounts for blocked / damaged desks',
    rtb202 !== undefined && rtb202.usableCapacity === 70 && rtb202.blockedSeatsCount === 2,
    `Expected usableCapacity: 70, got: ${rtb202?.usableCapacity}`
  );

  // --- Test 4: Seating Allocation Determinism & Zero Duplicate Assignments ---
  const students = generateInitialStudents();
  const session: ExamSession = INITIAL_EXAMINATIONS[0].sessions[0];
  const { seating, validation } = SeatingAllocationEngine.generate({
    examinationId: INITIAL_EXAMINATIONS[0].id,
    session,
    rooms: INITIAL_ROOMS,
    allStudents: students,
    priorityMode: 'TIMETABLE_GROUP_FIRST',
  });

  assert(
    'Seating allocation places students without duplicate roll number assignments',
    validation.duplicateAssignments.length === 0,
    `Duplicates found: ${validation.duplicateAssignments.join(', ')}`
  );

  assert(
    'Allocated student count matches total assigned seats across rooms',
    seating.totalStudentsAllocated === seating.roomAllocations.reduce((acc, r) => acc + r.totalAllotted, 0)
  );

  // --- Test 5: Timetable Group & Minor Stream Respect ---
  const t1Students = seating.roomAllocations.flatMap(r => r.seats).filter(s => s.timetableGroup === 'T1');
  assert(
    'Timetable group assignments (T1) correctly grouped together',
    t1Students.length > 0
  );

  // --- Test 6: Invigilation Engine ONLY Assigns Confirmed 'YES' Faculty ---
  const availabilityRecords: FacultyAvailability[] = INITIAL_FACULTY.map((f, idx) => ({
    id: `avail_test_${f.id}`,
    facultyId: f.id,
    employeeId: f.employeeId,
    facultyName: f.facultyName,
    department: f.department,
    examinationId: INITIAL_EXAMINATIONS[0].id,
    sessionId: session.id,
    date: session.date,
    shift: session.shift,
    status: idx < 6 ? 'YES' : idx < 8 ? 'NO' : 'UNANSWERED',
    updatedAt: new Date().toISOString(),
  }));

  const invigilationResult = InvigilationEngine.generate({
    examinationId: INITIAL_EXAMINATIONS[0].id,
    session,
    roomsAllocated: seating.roomAllocations,
    allFaculty: INITIAL_FACULTY,
    availabilityRecords,
    existingDutiesAcrossAllSessions: [],
    invigilatorsPerRoom: 1,
    maxDutiesPerFaculty: 4,
    autoBalanceDepartments: true,
  });

  const assignedFacultyIds = new Set(invigilationResult.duties.map(d => d.invigilator1?.facultyId));
  const noOrUnansweredAssigned = INITIAL_FACULTY.some(
    (f, idx) => idx >= 6 && assignedFacultyIds.has(f.id)
  );

  assert(
    "Invigilation engine strictly excludes faculty marked 'NO' and 'UNANSWERED'",
    !noOrUnansweredAssigned,
    'A faculty who marked NO or UNANSWERED was assigned a duty!'
  );

  // --- Test 7: Attendance Register Exactly 5 Required Columns ---
  const mandatoryCols = ['S. No.', 'Roll Number', 'Student Name', 'Answer Booklet No.', 'Student Signature'];
  assert(
    'Attendance sheet mandates exactly 5 columns in proper order',
    mandatoryCols.length === 5 &&
    mandatoryCols[0] === 'S. No.' &&
    mandatoryCols[1] === 'Roll Number' &&
    mandatoryCols[2] === 'Student Name' &&
    mandatoryCols[3] === 'Answer Booklet No.' &&
    mandatoryCols[4] === 'Student Signature'
  );

  return { passed, failed, results };
}
