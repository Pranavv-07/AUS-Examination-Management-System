import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  DoorOpen,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export const AnalyticsReporting: React.FC = () => {
  const rooms = db.getRooms();
  const students = db.getStudents();
  const faculty = db.getFaculty();
  const seatings = db.getSeatingArrangements();
  const exams = db.getExaminations();

  // Branch breakdown
  const branchCounts: { [branch: string]: number } = {};
  students.forEach(s => {
    branchCounts[s.branch] = (branchCounts[s.branch] || 0) + 1;
  });

  // Department faculty counts
  const deptCounts: { [dept: string]: number } = {};
  faculty.forEach(f => {
    deptCounts[f.department] = (deptCounts[f.department] || 0) + 1;
  });

  const maxBranchCount = Math.max(...Object.values(branchCounts), 1);
  const maxRoomCapacity = Math.max(...rooms.map(r => r.usableCapacity), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#EA580C]" />
              Examination Analytics & Utilization Reports
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              INSTITUTIONAL METRICS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hall capacity utilization, student branch distributions, and faculty invigilation workload parity.
          </p>
        </div>
      </div>

      {/* Top 3 KPI metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Overall Seating Utilization</span>
            <DoorOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#002147] font-heading">
            {rooms.length > 0
              ? `${Math.round(
                  (seatings[0]?.totalStudentsAllocated || 0) /
                    rooms.reduce((a, b) => a + b.usableCapacity, 0) *
                    100
                )}%`
              : '0%'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {seatings[0]?.totalStudentsAllocated || 0} seats utilized of {rooms.reduce((a, b) => a + b.usableCapacity, 0)} total usable capacity
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Registered Candidates</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-[#002147] font-heading">{students.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {Object.keys(branchCounts).length} academic engineering disciplines</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Invigilator Pool</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-[#002147] font-heading">{faculty.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Equitably distributed across {Object.keys(deptCounts).length} departments</p>
        </div>
      </div>

      {/* Visual Chart 1: Hall Capacities & Allotted Seats */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-[#EA580C]" />
          Hall Usable Capacity Distribution
        </h3>
        <p className="text-xs text-slate-500">
          Capacity breakdown per examination hall based on 3-seats per bench configuration.
        </p>

        <div className="space-y-3 pt-2">
          {rooms.map(room => {
            const percentage = Math.round((room.usableCapacity / maxRoomCapacity) * 100);
            return (
              <div key={room.id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">
                    {room.roomNumber} ({room.building.split(' ')[0]}) — Floor: {room.floor}
                  </span>
                  <span className="text-blue-900 font-bold">{room.usableCapacity} Usable Seats</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#002147] to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Chart 2: Student Enrollment by Discipline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Students by Engineering Branch
          </h3>
          <div className="space-y-2.5 pt-2">
            {Object.entries(branchCounts).map(([branch, count]) => {
              const widthPct = Math.round((count / maxBranchCount) * 100);
              return (
                <div key={branch} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800">{branch}</span>
                    <span className="text-slate-600 font-semibold">{count} Students</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EA580C] rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-500" />
            Faculty Registry by Department
          </h3>
          <div className="space-y-2.5 pt-2">
            {Object.entries(deptCounts).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-800">{dept}</span>
                <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {count} Faculty Members
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
