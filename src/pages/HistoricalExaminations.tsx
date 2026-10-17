import React from 'react';
import { db } from '../services/dbStorage';
import { Archive, Calendar, CheckCircle2, Lock, FileText, Download } from 'lucide-react';

export const HistoricalExaminations: React.FC = () => {
  const exams = db.getExaminations();

  // Mock past historical examinations
  const historicalExams = [
    {
      id: 'hist_apr_2026',
      code: 'AU-EXAM-APR-2026-02',
      title: 'B.Tech IV & VI Semester End Regular Examinations - April 2026',
      academicYear: '2025-2026',
      regulation: 'AR20',
      totalCandidates: 342,
      totalRoomsUsed: 6,
      completedDate: '2026-04-28',
      status: 'ARCHIVED',
      auditHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    },
    {
      id: 'hist_nov_2025',
      code: 'AU-EXAM-NOV-2025-01',
      title: 'B.Tech I Year I Semester Supplementary Examinations - November 2025',
      academicYear: '2025-2026',
      regulation: 'AR23',
      totalCandidates: 188,
      totalRoomsUsed: 4,
      completedDate: '2025-11-20',
      status: 'ARCHIVED',
      auditHash: 'SHA256:4a3557e04005b6305a4687d902194c79860eb34ea3da1e92d64f0f63901b8d7d',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
            <Archive className="w-5 h-5 text-[#EA580C]" />
            Historical Examinations & Frozen Snapshots
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived examinations with locked seating allocations, attendance registers, and cryptographic immutability.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {historicalExams.map(ex => (
          <div key={ex.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-800 font-extrabold text-[10px] px-2 py-0.5 rounded">
                    {ex.code}
                  </span>
                  <span className="bg-purple-100 text-purple-800 font-extrabold text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    LOCKED SNAPSHOT
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#002147] font-heading mt-1">{ex.title}</h3>
                <p className="text-xs text-slate-500">
                  AY: {ex.academicYear} • Regulation: {ex.regulation} • Completed On: {ex.completedDate}
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-500">Candidates Seated: </span>
                <strong className="text-slate-800">{ex.totalCandidates}</strong>
                <br />
                <span className="text-slate-500">Halls Used: </span>
                <strong className="text-slate-800">{ex.totalRoomsUsed}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="font-mono text-[10px] text-slate-400 truncate max-w-md">
                Tamper-proof Seal: {ex.auditHash}
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Archive Preserved
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
