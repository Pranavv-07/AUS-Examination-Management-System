import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { Department } from '../types';
import { Building, Plus, Edit2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>(db.getDepartments());
  const [feedback, setFeedback] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formBranches, setFormBranches] = useState('');
  const [formHod, setFormHod] = useState('');

  const handleOpenAdd = () => {
    setFormCode('IT');
    setFormName('Information Technology');
    setFormBranches('IT, Cyber Security');
    setFormHod('Dr. Department Head');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newDept: Department = {
      id: `dept_${formCode.toLowerCase()}`,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      branches: formBranches.split(',').map(b => b.trim()),
      hodName: formHod.trim(),
    };
    db.saveDepartment(newDept);
    setDepartments(db.getDepartments());
    setIsModalOpen(false);
    setFeedback(`Department ${newDept.code} saved.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
            <Building className="w-5 h-5 text-[#EA580C]" />
            Departments & Academic Programs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aditya University engineering departments, branch codes, and HOD registries.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Department
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => (
          <div key={dept.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-blue-900 font-heading">{dept.code}</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-100">
                {dept.branches.length} Programs
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-800">{dept.name}</h3>
            <p className="text-xs text-slate-500">HOD: {dept.hodName || 'Not Assigned'}</p>
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
              {dept.branches.map((b, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  {b}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Department">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department Code *</label>
            <input
              type="text"
              required
              value={formCode}
              onChange={e => setFormCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Branches (comma-separated)</label>
            <input
              type="text"
              value={formBranches}
              onChange={e => setFormBranches(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Head of Department (HOD)</label>
            <input
              type="text"
              value={formHod}
              onChange={e => setFormHod(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#002147] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
