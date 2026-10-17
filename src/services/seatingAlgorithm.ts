import {
  Student,
  Room,
  ExamSession,
  SeatingArrangement,
  RoomAllocation,
  SeatAllocation,
  RollNumberRange,
} from '../types';

export interface SeatingGenerationOptions {
  examinationId: string;
  session: ExamSession;
  rooms: Room[];
  allStudents: Student[];
  priorityMode?: 'TIMETABLE_GROUP_FIRST' | 'BRANCH_FIRST' | 'ROLL_NUMBER_FIRST';
  defaultMixing?: '3-5-3' | '5-3-5';
}

export interface SeatingValidationResult {
  isValid: boolean;
  totalEligible: number;
  totalAllocated: number;
  unallocatedStudents: Student[];
  roomsUsed: number;
  roomCapacities: { roomNumber: string; usableCapacity: number; allocated: number }[];
  duplicateAssignments: string[];
  warnings: string[];
  errors: string[];
}

export class SeatingAllocationEngine {
  public static generate(options: SeatingGenerationOptions): {
    seating: SeatingArrangement;
    validation: SeatingValidationResult;
  } {
    const { examinationId, session, rooms, allStudents, priorityMode = 'TIMETABLE_GROUP_FIRST' } = options;

    // Filter eligible students taking subjects in this session
    const sessionSubjects = session.subjects;
    const eligibleStudents: (Student & { targetSubject: typeof sessionSubjects[0] })[] = [];

    for (const subj of sessionSubjects) {
      const matched = allStudents.filter(
        s =>
          s.isEligible &&
          s.status === 'ACTIVE' &&
          s.branch === subj.branch &&
          s.semester === subj.semester &&
          (subj.timetableCategory ? s.timetableGroup === subj.timetableCategory : true)
      );

      for (const st of matched) {
        if (!eligibleStudents.some(es => es.rollNumber === st.rollNumber)) {
          eligibleStudents.push({ ...st, targetSubject: subj });
        }
      }
    }

    // Sort students based on priority rules
    eligibleStudents.sort((a, b) => {
      if (priorityMode === 'TIMETABLE_GROUP_FIRST') {
        if ((a.timetableGroup || '') !== (b.timetableGroup || '')) {
          return (a.timetableGroup || '').localeCompare(b.timetableGroup || '');
        }
      }
      if (a.semester !== b.semester) {
        return a.semester.localeCompare(b.semester);
      }
      if (a.branch !== b.branch) {
        return a.branch.localeCompare(b.branch);
      }
      return a.rollNumber.localeCompare(b.rollNumber);
    });

    // Partition students by semester for mixing ('3' represents 3rd sem / 2nd year; '5' represents 5th sem / 3rd year)
    const sem3Pool = eligibleStudents.filter(s => s.semester === '3' || s.academicYear === '2');
    const sem5Pool = eligibleStudents.filter(s => s.semester === '5' || s.academicYear === '3');
    const otherPool = eligibleStudents.filter(s => s.semester !== '3' && s.semester !== '5' && s.academicYear !== '2' && s.academicYear !== '3');

    // Queues
    const queue3 = [...sem3Pool];
    const queue5 = [...sem5Pool];
    const queueOther = [...otherPool];

    const roomAllocations: RoomAllocation[] = [];
    const assignedRollNumbers = new Set<string>();
    const duplicateAssignments: string[] = [];

    // Filter active rooms with capacity
    const activeRooms = rooms.filter(r => r.isActive && r.usableCapacity > 0);

    for (const room of activeRooms) {
      if (queue3.length === 0 && queue5.length === 0 && queueOther.length === 0) {
        break; // All students allocated
      }

      const seatsAllocatedInRoom: SeatAllocation[] = [];
      const benches = room.layout.benches || [];

      // Sort benches in standard academic room order (Col 0..N, Row 0..M)
      const sortedBenches = [...benches].sort((a, b) => {
        if (a.colIndex !== b.colIndex) return a.colIndex - b.colIndex;
        return a.rowIndex - b.rowIndex;
      });

      for (const bench of sortedBenches) {
        for (const seat of bench.seats) {
          if (seat.isBlocked || seat.targetGroup === 'BLOCKED') {
            continue; // Skip damaged/blocked seat
          }

          let studentToAssign: (typeof eligibleStudents)[0] | undefined = undefined;

          // Target group matching
          if (seat.targetGroup === '3') {
            if (queue3.length > 0) {
              studentToAssign = queue3.shift();
            } else if (queueOther.length > 0) {
              studentToAssign = queueOther.shift();
            } else if (queue5.length > 0) {
              // Fallback if 3rd sem is exhausted
              studentToAssign = queue5.shift();
            }
          } else if (seat.targetGroup === '5') {
            if (queue5.length > 0) {
              studentToAssign = queue5.shift();
            } else if (queueOther.length > 0) {
              studentToAssign = queueOther.shift();
            } else if (queue3.length > 0) {
              // Fallback if 5th sem is exhausted
              studentToAssign = queue3.shift();
            }
          } else {
            // ANY
            if (queue3.length > 0) {
              studentToAssign = queue3.shift();
            } else if (queue5.length > 0) {
              studentToAssign = queue5.shift();
            } else if (queueOther.length > 0) {
              studentToAssign = queueOther.shift();
            }
          }

          if (studentToAssign) {
            if (assignedRollNumbers.has(studentToAssign.rollNumber)) {
              duplicateAssignments.push(studentToAssign.rollNumber);
            }
            assignedRollNumbers.add(studentToAssign.rollNumber);

            seatsAllocatedInRoom.push({
              benchId: bench.benchId,
              colIndex: bench.colIndex,
              rowIndex: bench.rowIndex,
              seatIndex: seat.seatIndex,
              benchNumber: bench.benchNumber,
              seatLabel: `C${bench.colIndex + 1}-R${bench.rowIndex + 1}-S${seat.seatIndex + 1}`,
              studentId: studentToAssign.id,
              rollNumber: studentToAssign.rollNumber,
              studentName: studentToAssign.studentName,
              branch: studentToAssign.branch,
              academicYear: studentToAssign.academicYear,
              semester: studentToAssign.semester,
              section: studentToAssign.section,
              subjectCode: studentToAssign.targetSubject.subjectCode,
              subjectName: studentToAssign.targetSubject.subjectName,
              timetableGroup: studentToAssign.timetableGroup,
            });
          }
        }
      }

      if (seatsAllocatedInRoom.length > 0) {
        // Compute roll number ranges for the room
        const rollRanges = this.computeRollNumberRanges(seatsAllocatedInRoom);

        roomAllocations.push({
          roomId: room.id,
          roomNumber: room.roomNumber,
          building: room.building,
          floor: room.floor,
          totalAllotted: seatsAllocatedInRoom.length,
          usableCapacity: room.usableCapacity,
          rollNumberRanges: rollRanges,
          seats: seatsAllocatedInRoom,
        });
      }
    }

    const unallocated = [...queue3, ...queue5, ...queueOther];
    const totalAllocated = assignedRollNumbers.size;
    const shortageReasons: string[] = [];

    if (unallocated.length > 0) {
      shortageReasons.push(
        `Insufficient room capacity: ${unallocated.length} students could not be seated across ${activeRooms.length} available rooms.`
      );
    }

    const seatingArrangement: SeatingArrangement = {
      id: `seating_${session.id}_${Date.now()}`,
      examinationId,
      sessionId: session.id,
      date: session.date,
      shift: session.shift,
      roomAllocations,
      totalStudentsAllocated: totalAllocated,
      totalRoomsUsed: roomAllocations.length,
      shortageCount: unallocated.length,
      shortageReasons: shortageReasons.length > 0 ? shortageReasons : undefined,
      status: 'DRAFT',
      generatedAt: new Date().toISOString(),
      revision: 1,
    };

    const validation: SeatingValidationResult = {
      isValid: unallocated.length === 0 && duplicateAssignments.length === 0,
      totalEligible: eligibleStudents.length,
      totalAllocated,
      unallocatedStudents: unallocated,
      roomsUsed: roomAllocations.length,
      roomCapacities: roomAllocations.map(r => ({
        roomNumber: r.roomNumber,
        usableCapacity: r.usableCapacity,
        allocated: r.totalAllotted,
      })),
      duplicateAssignments,
      warnings:
        unallocated.length > 0
          ? [`Warning: Room shortage of ${unallocated.length} seats. Please activate or configure additional rooms.`]
          : [],
      errors: duplicateAssignments.length > 0 ? [`Fatal duplicate student allocations detected.`] : [],
    };

    return { seating: seatingArrangement, validation };
  }

  // Group continuous roll numbers into formal ranges (e.g. 23A91A0501 - 23A91A0524)
  public static computeRollNumberRanges(seats: SeatAllocation[]): RollNumberRange[] {
    const ranges: RollNumberRange[] = [];
    const validSeats = seats.filter(s => !s.isVacant && s.rollNumber && s.rollNumber.trim() !== '');

    // Group seats by branch, semester, and subject
    const groups: { [key: string]: SeatAllocation[] } = {};
    for (const seat of validSeats) {
      const key = `${seat.branch}__${seat.semester}__${seat.subjectCode || 'GEN'}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(seat);
    }

    for (const key of Object.keys(groups)) {
      const items = groups[key].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
      if (items.length === 0) continue;

      let rangeStart = items[0];
      let prev = items[0];
      let count = 1;

      for (let i = 1; i < items.length; i++) {
        const curr = items[i];
        // Check if continuous roll number (assuming last 2 or 4 digits increment by 1)
        const prevNum = parseInt(prev.rollNumber.slice(-4), 10);
        const currNum = parseInt(curr.rollNumber.slice(-4), 10);

        if (!isNaN(prevNum) && !isNaN(currNum) && currNum === prevNum + 1) {
          prev = curr;
          count++;
        } else {
          ranges.push({
            branch: rangeStart.branch,
            semester: rangeStart.semester,
            academicYear: rangeStart.academicYear,
            fromRoll: rangeStart.rollNumber,
            toRoll: prev.rollNumber,
            count,
            timetableGroup: rangeStart.timetableGroup,
            subjectName: rangeStart.subjectName,
          });
          rangeStart = curr;
          prev = curr;
          count = 1;
        }
      }

      ranges.push({
        branch: rangeStart.branch,
        semester: rangeStart.semester,
        academicYear: rangeStart.academicYear,
        fromRoll: rangeStart.rollNumber,
        toRoll: prev.rollNumber,
        count,
        timetableGroup: rangeStart.timetableGroup,
        subjectName: rangeStart.subjectName,
      });
    }

    return ranges;
  }
}
