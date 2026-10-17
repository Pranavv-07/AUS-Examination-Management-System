import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { ExcelService } from '../services/excelService';
import { Faculty } from '../types';
import { Modal } from '../components/Modal';
import {
  Users,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  Briefcase,
  Phone,
  Mail,
} from 'lucide-react';

export const FacultyManagement: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>(db.getFaculty());
  const departments = db.getDepartments();
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [feedback, setFeedback] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  // Form State
  const [formEmpId, setFormEmpId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('CSE');
  const [formDesig, setFormDesig] = useState('Assistant Professor');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formActive, setFormActive] = useState(true);

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setFormEmpId(`AU_FAC_${faculty.length + 101}`);
    setFormName('');
    setFormDept('CSE');
    setFormDesig('Assistant Professor');
    setFormEmail('');
    setFormPhone('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Faculty) => {
    setEditingFaculty(f);
    setFormEmpId(f.employeeId);
    setFormName(f.facultyName);
    setFormDept(f.department);
    setFormDesig(f.designation);
    setFormEmail(f.email || '');
    setFormPhone(f.phone || '');
    setFormActive(f.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId || !formName) return;

    const facToSave: Faculty = {
      id: editingFaculty ? editingFaculty.id : `fac_${Date.now()}`,
      employeeId: formEmpId.trim().toUpperCase(),
      facultyName: formName.trim(),
      department: formDept,
      designation: formDesig,
      email: formEmail ? formEmail.trim() : undefined,
      phone: formPhone ? formPhone.trim() : undefined,
      isActive: formActive,
      totalDutiesCompleted: editingFaculty?.totalDutiesCompleted || 0,
      createdAt: editingFaculty?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveFaculty(facToSave);
    setFaculty(db.getFaculty());
    setIsModalOpen(false);
    setFeedback(`Faculty record ${facToSave.employeeId} saved successfully.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleDelete = (id: string, empId: string) => {
    if (confirm(`Are you sure you want to delete faculty ${empId}?`)) {
      db.deleteFaculty(id);
      setFaculty(db.getFaculty());
      setFeedback(`Removed faculty ${empId}.`);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawRows = await ExcelService.parseExcelFile(file);
      const newFaculty: Faculty[] = rawRows.map((row, idx) => ({
        id: `fac_${Date.now()}_${idx}`,
        employeeId: String(row['Employee ID'] || row['employeeId'] || `AU_FAC_${idx + 200}`).trim().toUpperCase(),
        facultyName: String(row['Faculty Name'] || row['facultyName'] || 'Faculty Member').trim(),
        department: String(row['Department'] || row['department'] || 'CSE').trim().toUpperCase(),
        designation: String(row['Designation'] || 'Assistant Professor'),
        email: row['Email'] || undefined,
        phone: row['Phone'] ? String(row['Phone']) : undefined,
        isActive: true,
        totalDutiesCompleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const res = db.bulkUpsertFaculty(newFaculty, 'Excel Import');
      setFaculty(db.getFaculty());
      setFeedback(`Imported ${res.added} new faculty and updated ${res.updated} records.`);
      setTimeout(() => setFeedback(''), 5000);
    } catch (err) {
      alert(`Error reading faculty file: ${(err as Error).message}`);
    }
    e.target.value = '';
  };

  const filtered = faculty.filter(f => {
    if (deptFilter !== 'ALL' && f.department !== deptFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return f.employeeId.toLowerCase().includes(q) || f.facultyName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-[#EA580C]" />
              Faculty Registry & Invigilators
            </h1>
            <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              {faculty.length} REGISTERED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee IDs, departments, invigilation duty limits, and batch Excel rosters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => ExcelService.exportFacultyTemplate()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Excel Template
          </button>

          <label className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Upload Faculty Excel
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Faculty
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Employee ID (AU_FAC_101) or Faculty Name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#002147] text-white uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Employee ID</th>
              <th className="py-2.5 px-3">Faculty Name</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Designation</th>
              <th className="py-2.5 px-3">Contact</th>
              <th className="py-2.5 px-3 text-center">Duties Done</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-slate-400" />
                    <p className="font-bold text-slate-700">No faculty members found matching your search.</p>
                    <p className="text-[11px] text-slate-400">Click "Add Faculty" to register a new member or reset filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(f => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{f.employeeId}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{f.facultyName}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{f.department}</td>
                  <td className="py-2.5 px-3 text-slate-600">{f.designation}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {f.email && <div>{f.email}</div>}
                    {f.phone && <div>{f.phone}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{f.totalDutiesCompleted}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.2 rounded text-[10px] font-extrabold ${
                        f.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {f.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(f)}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id, f.employeeId)}
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaculty ? `Edit Faculty: ${editingFaculty.employeeId}` : 'Add Faculty Member'}
        subtitle="Employee ID must be unique across Aditya University departments."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formEmpId}
                onChange={e => setFormEmpId(e.target.value.toUpperCase())}
                placeholder="e.g. AU_FAC_116"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Dr. K. S. Rama Krishna"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={formDept}
                onChange={e => setFormDept(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={formDesig}
                onChange={e => setFormDesig(e.target.value)}
                placeholder="e.g. Assistant Professor"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="name@adityauniversity.in"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="9848123456"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeCheck"
              checked={formActive}
              onChange={e => setFormActive(e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="activeCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Active for invigilation duties
            </label>
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
              Save Faculty Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
