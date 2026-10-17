import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { AuditLog } from '../types';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  UserCheck,
  Clock,
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filtered = logs.filter(log => {
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.actor.username.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <History className="w-5 h-5 text-[#EA580C]" />
              System Audit Logs & Security Trail
            </h1>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of examination scheduling, room layout revisions, student data changes, and downloads.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
          />
        </div>

        <div>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Modules</option>
            <option value="Authentication">Authentication</option>
            <option value="Room Management">Room Management</option>
            <option value="Seating Generator">Seating Generator</option>
            <option value="Invigilation Generator">Invigilation Generator</option>
            <option value="Student Management">Student Management</option>
            <option value="Faculty Management">Faculty Management</option>
            <option value="Attendance Management">Attendance Management</option>
            <option value="Document Hub">Document Hub</option>
            <option value="Portal Settings">Portal Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#002147] text-white uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Actor</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Module</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Change Summary</th>
              <th className="py-2.5 px-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{log.actor.username}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                      log.actor.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.actor.role}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-700">{log.module}</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-blue-900 font-bold">{log.action}</td>
                <td className="py-2.5 px-3 text-slate-600 max-w-md">{log.details}</td>
                <td className="py-2.5 px-3 font-mono text-slate-400 text-[10px]">{log.ipAddress || '10.10.1.45'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
