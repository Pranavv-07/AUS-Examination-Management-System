import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { User } from '../types';
import { Modal } from '../components/Modal';
import {
  ShieldAlert,
  UserPlus,
  KeyRound,
  CheckCircle2,
  Trash2,
  UserCheck,
  Shield,
  Lock,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const buildings = db.getBuildings();
  const currentUser = db.getCurrentUser();
  const [feedback, setFeedback] = useState('');

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('CSE');
  const [formPassword, setFormPassword] = useState('examiner123');
  const [formAssignedBuildings, setFormAssignedBuildings] = useState<string[]>(['bld_rtb']);

  // Guard: Admin role only
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Only the University Admin (Chief Controller of Examinations) has permission to provision and manage Examiner credentials.
        </p>
      </div>
    );
  }

  const handleOpenAddExaminer = () => {
    setFormUsername(`examiner_${Date.now().toString().slice(-3)}`);
    setFormName('');
    setFormEmail('');
    setFormDept('CSE');
    setFormPassword('examiner123');
    setFormAssignedBuildings(['bld_rtb']);
    setIsModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formName || !formEmail) return;

    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: formUsername.trim().toLowerCase(),
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: 'EXAMINER', // Only Examiners can be created
      department: formDept,
      assignedBuildingIds: formAssignedBuildings,
      isActive: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    };

    try {
      db.saveUser(newUser);
      setUsers(db.getUsers());
      setIsModalOpen(false);
      setFeedback(`Successfully created Examiner account: ${newUser.username} (${newUser.name})`);
      setTimeout(() => setFeedback(''), 5000);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleToggleActive = (user: User) => {
    if (user.username === 'admin') {
      alert('The root bootstrap Admin account cannot be deactivated.');
      return;
    }
    const updated = { ...user, isActive: !user.isActive };
    db.saveUser(updated);
    setUsers(db.getUsers());
    setFeedback(`Account ${user.username} is now ${updated.isActive ? 'ACTIVE' : 'DEACTIVATED'}.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleResetPassword = (user: User) => {
    const newPass = prompt(`Enter new password for ${user.username}:`, 'examiner123');
    if (newPass) {
      db.saveUser({ ...user, mustChangePassword: true });
      db.logAudit('USER_PASSWORD_RESET', 'User Management', `Password reset for ${user.username} by Admin`);
      setFeedback(`Password reset successfully for ${user.username}.`);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#EA580C]" />
              User & Examiner Account Management
            </h1>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              ADMIN CONTROL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin exclusive module. Provision new Examiner accounts, activate/deactivate credentials, and reset access.
          </p>
        </div>

        <button
          onClick={handleOpenAddExaminer}
          className="px-3.5 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Create Examiner Account
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#002147] text-white uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Username</th>
              <th className="py-2.5 px-3">Full Name</th>
              <th className="py-2.5 px-3">Email Address</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Permitted Buildings / Blocks</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {users.map(u => {
              const assignedBlds = (u.assignedBuildingIds || [])
                .map(id => buildings.find(b => b.id === id)?.code || id);
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{u.username}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{u.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{u.department || 'Examination Cell'}</td>
                  <td className="py-2.5 px-3">
                    {u.role === 'ADMIN' ? (
                      <span className="text-slate-500 font-semibold text-[11px]">All Campus Blocks (Superadmin)</span>
                    ) : assignedBlds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedBlds.map(code => (
                          <span
                            key={code}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Department Match</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.2 rounded text-[10px] font-extrabold ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="px-2 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3 h-3" />
                        Reset Pass
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Examiner Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Examiner Account"
        subtitle="Only Admin can create Examiner credentials and assign building block permissions."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={formUsername}
                onChange={e => setFormUsername(e.target.value.toLowerCase())}
                placeholder="e.g. examiner_mech"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Dr. Pritam Das"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="examiner@adityauniversity.in"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formDept}
                onChange={e => setFormDept(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assign Permitted Building Blocks (Examiner will control rooms inside these blocks)
            </label>
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              {buildings.map(b => {
                const checked = formAssignedBuildings.includes(b.id);
                return (
                  <label key={b.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setFormAssignedBuildings(formAssignedBuildings.filter(id => id !== b.id));
                        } else {
                          setFormAssignedBuildings([...formAssignedBuildings, b.id]);
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>{b.code} — {b.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
            <input
              type="text"
              required
              value={formPassword}
              onChange={e => setFormPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">User will be prompted to change password on first login.</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Create Examiner
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
