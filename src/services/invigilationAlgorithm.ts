import {
  Faculty,
  FacultyAvailability,
  ExamSession,
  RoomAllocation,
  InvigilationDuty,
} from '../types';

export interface InvigilationOptions {
  examinationId: string;
  session: ExamSession;
  roomsAllocated: RoomAllocation[];
  allFaculty: Faculty[];
  availabilityRecords: FacultyAvailability[];
  existingDutiesAcrossAllSessions: InvigilationDuty[];
  invigilatorsPerRoom?: number; // 1 or 2
  maxDutiesPerFaculty?: number;
  autoBalanceDepartments?: boolean;
  lockedDuties?: InvigilationDuty[];
}

export interface InvigilationResult {
  duties: InvigilationDuty[];
  unfilledRooms: { roomId: string; roomNumber: string; slot: 'Invigilator I' | 'Invigilator II' }[];
  totalAssigned: number;
  totalRequired: number;
  facultyDutyCounts: { employeeId: string; name: string; department: string; count: number }[];
  warnings: string[];
}

export class InvigilationEngine {
  public static generate(options: InvigilationOptions): InvigilationResult {
    const {
      examinationId,
      session,
      roomsAllocated,
      allFaculty,
      availabilityRecords,
      existingDutiesAcrossAllSessions,
      invigilatorsPerRoom = 1,
      maxDutiesPerFaculty = 4,
      autoBalanceDepartments = true,
      lockedDuties = [],
    } = options;

    const warnings: string[] = [];
    const unfilledRooms: { roomId: string; roomNumber: string; slot: 'Invigilator I' | 'Invigilator II' }[] = [];

    // Filter faculty who explicitly marked 'YES' for this session
    const yesFacultyIds = new Set(
      availabilityRecords
        .filter(a => a.sessionId === session.id && a.status === 'YES')
        .map(a => a.facultyId)
    );

    // Compute duty counts for all faculty so far
    const facultyDutyMap = new Map<string, number>();
    allFaculty.forEach(f => facultyDutyMap.set(f.id, f.totalDutiesCompleted || 0));

    // Add duties already completed in other sessions
    existingDutiesAcrossAllSessions.forEach(d => {
      if (d.sessionId !== session.id) {
        if (d.invigilator1?.facultyId) {
          facultyDutyMap.set(d.invigilator1.facultyId, (facultyDutyMap.get(d.invigilator1.facultyId) || 0) + 1);
        }
        if (d.invigilator2?.facultyId) {
          facultyDutyMap.set(d.invigilator2.facultyId, (facultyDutyMap.get(d.invigilator2.facultyId) || 0) + 1);
        }
      }
    });

    // Available candidate pool (ONLY ACTIVE + YES marked)
    let candidatePool = allFaculty.filter(f => f.isActive && yesFacultyIds.has(f.id));

    if (candidatePool.length === 0) {
      warnings.push(`No faculty marked 'YES' for session on ${session.date} (${session.shift}). Please collect availability.`);
    }

    // Sort candidates by lowest duties first to achieve equitable workload balancing
    candidatePool.sort((a, b) => {
      const countA = facultyDutyMap.get(a.id) || 0;
      const countB = facultyDutyMap.get(b.id) || 0;
      if (countA !== countB) return countA - countB;
      return a.facultyName.localeCompare(b.facultyName);
    });

    const assignedInThisSession = new Set<string>();
    const duties: InvigilationDuty[] = [];

    // First preserve locked duties
    for (const locked of lockedDuties) {
      if (locked.sessionId === session.id) {
        duties.push(locked);
        if (locked.invigilator1?.facultyId) assignedInThisSession.add(locked.invigilator1.facultyId);
        if (locked.invigilator2?.facultyId) assignedInThisSession.add(locked.invigilator2.facultyId);
      }
    }

    const deptAssignmentCounts = new Map<string, number>();

    for (const room of roomsAllocated) {
      // Check if already locked
      const existing = duties.find(d => d.roomId === room.roomId);
      if (existing) continue;

      // Assign Invigilator 1
      const inv1Candidate = this.pickCandidate(
        candidatePool,
        assignedInThisSession,
        facultyDutyMap,
        maxDutiesPerFaculty,
        deptAssignmentCounts,
        autoBalanceDepartments
      );

      if (!inv1Candidate) {
        unfilledRooms.push({ roomId: room.roomId, roomNumber: room.roomNumber, slot: 'Invigilator I' });
        continue;
      }

      assignedInThisSession.add(inv1Candidate.id);
      facultyDutyMap.set(inv1Candidate.id, (facultyDutyMap.get(inv1Candidate.id) || 0) + 1);
      deptAssignmentCounts.set(inv1Candidate.department, (deptAssignmentCounts.get(inv1Candidate.department) || 0) + 1);

      let inv2Candidate: Faculty | undefined = undefined;
      if (invigilatorsPerRoom >= 2) {
        inv2Candidate = this.pickCandidate(
          candidatePool,
          assignedInThisSession,
          facultyDutyMap,
          maxDutiesPerFaculty,
          deptAssignmentCounts,
          autoBalanceDepartments,
          inv1Candidate.department // Try to pick different department for invigilator 2
        );

        if (!inv2Candidate) {
          unfilledRooms.push({ roomId: room.roomId, roomNumber: room.roomNumber, slot: 'Invigilator II' });
        } else {
          assignedInThisSession.add(inv2Candidate.id);
          facultyDutyMap.set(inv2Candidate.id, (facultyDutyMap.get(inv2Candidate.id) || 0) + 1);
          deptAssignmentCounts.set(inv2Candidate.department, (deptAssignmentCounts.get(inv2Candidate.department) || 0) + 1);
        }
      }

      duties.push({
        id: `duty_${session.id}_${room.roomId}`,
        examinationId,
        sessionId: session.id,
        date: session.date,
        shift: session.shift,
        roomId: room.roomId,
        roomNumber: room.roomNumber,
        building: room.building,
        invigilator1: {
          facultyId: inv1Candidate.id,
          employeeId: inv1Candidate.employeeId,
          facultyName: inv1Candidate.facultyName,
          department: inv1Candidate.department,
        },
        invigilator2: inv2Candidate
          ? {
              facultyId: inv2Candidate.id,
              employeeId: inv2Candidate.employeeId,
              facultyName: inv2Candidate.facultyName,
              department: inv2Candidate.department,
            }
          : undefined,
        status: 'DRAFT',
        generatedAt: new Date().toISOString(),
        revision: 1,
      });
    }

    const totalRequired = roomsAllocated.length * invigilatorsPerRoom;
    const totalAssigned = assignedInThisSession.size;

    if (unfilledRooms.length > 0) {
      warnings.push(`Shortage: ${unfilledRooms.length} invigilation slots could not be filled with confirmed available faculty.`);
    }

    const facultyDutyCounts = allFaculty.map(f => ({
      employeeId: f.employeeId,
      name: f.facultyName,
      department: f.department,
      count: facultyDutyMap.get(f.id) || 0,
    }));

    return {
      duties,
      unfilledRooms,
      totalAssigned,
      totalRequired,
      facultyDutyCounts,
      warnings,
    };
  }

  private static pickCandidate(
    pool: Faculty[],
    alreadyAssigned: Set<string>,
    dutyMap: Map<string, number>,
    maxLimit: number,
    deptMap: Map<string, number>,
    balanceDept: boolean,
    avoidDept?: string
  ): Faculty | undefined {
    const eligible = pool.filter(f => !alreadyAssigned.has(f.id) && (dutyMap.get(f.id) || 0) < maxLimit);

    if (eligible.length === 0) return undefined;

    if (balanceDept) {
      // Sort by duty count first, then by department workload
      eligible.sort((a, b) => {
        if (avoidDept) {
          if (a.department === avoidDept && b.department !== avoidDept) return 1;
          if (b.department === avoidDept && a.department !== avoidDept) return -1;
        }
        const countA = dutyMap.get(a.id) || 0;
        const countB = dutyMap.get(b.id) || 0;
        if (countA !== countB) return countA - countB;

        const deptUsageA = deptMap.get(a.department) || 0;
        const deptUsageB = deptMap.get(b.department) || 0;
        return deptUsageA - deptUsageB;
      });
    }

    return eligible[0];
  }
}
