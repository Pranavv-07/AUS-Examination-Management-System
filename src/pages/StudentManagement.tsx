import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { ExcelService } from '../services/excelService';
import { Student } from '../types';
import { Modal } from '../components/Modal';
import {
  GraduationCap,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(db.getStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [feedback, setFeedback] = useState('');

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formRoll, setFormRoll] = useState('');
  const [formName, setFormName] = useState('');
  const [formBranch, setFormBranch] = useState('CSE');
  const [formYear, setFormYear] = useState<'1' | '2' | '3' | '4'>('2');
  const [formSem, setFormSem] = useState<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'>('3');
  const [formSec, setFormSec] = useState('A');
  const [formGroup, setFormGroup] = useState<'T1' | 'T2' | 'T3' | 'T4' | ''>('T1');
  const [formMinor, setFormMinor] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'DETAINED' | 'CONDONATION'>('ACTIVE');

  // Excel Import Preview Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormRoll('');
    setFormName('');
    setFormBranch('CSE');
    setFormYear('2');
    setFormSem('3');
    setFormSec('A');
    setFormGroup('T1');
    setFormMinor('');
    setFormStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: Student) => {
    setEditingStudent(s);
    setFormRoll(s.rollNumber);
    setFormName(s.studentName);
    setFormBranch(s.branch);
    setFormYear(s.academicYear);
    setFormSem(s.semester);
    setFormSec(s.section);
    setFormGroup(s.timetableGroup || '');
    setFormMinor(s.minorStream || '');
    setFormStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoll || !formName) return;

    const studentToSave: Student = {
      id: editingStudent ? editingStudent.id : `std_${Date.now()}`,
      rollNumber: formRoll.trim().toUpperCase(),
      studentName: formName.trim().toUpperCase(),
      branch: formBranch,
      academicYear: formYear,
      semester: formSem,
      section: formSec,
      timetableGroup: formGroup ? (formGroup as any) : undefined,
      minorStream: formMinor ? formMinor.trim() : undefined,
      isEligible: formStatus === 'ACTIVE',
      status: formStatus,
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveStudent(studentToSave);
    setStudents(db.getStudents());
    setIsModalOpen(false);
    setFeedback(`Student record ${studentToSave.rollNumber} saved successfully.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleDeleteStudent = (id: string, roll: string) => {
    if (confirm(`Are you sure you want to delete student ${roll}?`)) {
      db.deleteStudent(id);
      setStudents(db.getStudents());
      setFeedback(`Removed student ${roll}.`);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  // Handle Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawRows = await ExcelService.parseExcelFile(file);
      setImportPreviewData(rawRows);
      setIsImportModalOpen(true);
    } catch (err) {
      alert(`Error reading file: ${(err as Error).message}`);
    }
    e.target.value = '';
  };

  // Commit imported rows to database
  const handleConfirmImport = () => {
    const newStudents: Student[] = importPreviewData.map((row, idx) => {
      const roll = String(row['Roll Number'] || row['rollNumber'] || row['ROLL'] || `AU_${idx + 1}`).trim().toUpperCase();
      const name = String(row['Student Name'] || row['studentName'] || row['NAME'] || 'UNNAMED').trim().toUpperCase();
      const branch = String(row['Branch'] || row['branch'] || 'CSE').trim().toUpperCase();
      const sem = String(row['Semester'] || row['semester'] || '3') as any;
      const yr = (sem === '3' || sem === '4' ? '2' : sem === '5' || sem === '6' ? '3' : '4') as any;

      return {
        id: `std_${Date.now()}_${idx}`,
        rollNumber: roll,
        studentName: name,
        branch,
        academicYear: yr,
        semester: sem,
        section: String(row['Section'] || 'A').toUpperCase(),
        timetableGroup: row['Timetable Group'] ? row['Timetable Group'] : undefined,
        minorStream: row['Minor Stream'] ? row['Minor Stream'] : undefined,
        isEligible: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const result = db.bulkUpsertStudents(newStudents, 'Excel Spreadsheet Import');
    setStudents(db.getStudents());
    setIsImportModalOpen(false);
    setFeedback(`Imported ${result.added} new records and updated ${result.updated} existing student records in MongoDB.`);
    setTimeout(() => setFeedback(''), 5000);
  };

  const filtered = students.filter(s => {
    if (branchFilter !== 'ALL' && s.branch !== branchFilter) return false;
    if (semesterFilter !== 'ALL' && s.semester !== semesterFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.rollNumber.toLowerCase().includes(q) || s.studentName.toLowerCase().includes(q);
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
              <GraduationCap className="w-5 h-5 text-[#EA580C]" />
              Student Academic Records
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              {students.length} TOTAL IN DATABASE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage roll numbers, academic years, semesters, timetable groups (T1-T4), and batch Excel imports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => ExcelService.exportStudentTemplate()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Excel Template
          </button>

          <label className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Upload Excel / CSV
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Student
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Roll No (e.g. 23A91A0501) or Name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Branches</option>
            <option value="CSE">CSE (Computer Science)</option>
            <option value="AIML">AIML (Artificial Intelligence)</option>
            <option value="ECE">ECE (Electronics & Comm)</option>
            <option value="EEE">EEE (Electrical)</option>
            <option value="MECH">MECH (Mechanical)</option>
            <option value="CIVIL">CIVIL</option>
          </select>
        </div>

        <div>
          <select
            value={semesterFilter}
            onChange={e => setSemesterFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Semesters</option>
            <option value="3">Semester 3 (2nd Year)</option>
            <option value="5">Semester 5 (3rd Year)</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#002147] text-white uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Roll Number</th>
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Branch</th>
              <th className="py-2.5 px-3">Year & Sem</th>
              <th className="py-2.5 px-3">Sec</th>
              <th className="py-2.5 px-3">Timetable Group</th>
              <th className="py-2.5 px-3">Minor Stream</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <GraduationCap className="w-8 h-8 text-slate-400" />
                    <p className="font-bold text-slate-700">No student records match your filter criteria.</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your search query, or click "Add Student" to create a new record.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.slice(0, 100).map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{s.rollNumber}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800 uppercase">{s.studentName}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{s.branch}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    Yr {s.academicYear} / Sem {s.semester}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{s.section}</td>
                  <td className="py-2.5 px-3">
                    {s.timetableGroup ? (
                      <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {s.timetableGroup}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{s.minorStream || '—'}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.2 rounded text-[10px] font-extrabold ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(s.id, s.rollNumber)}
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.rollNumber}` : 'Register New Student'}
        subtitle="Ensure roll numbers match Aditya University registration database."
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
              <input
                type="text"
                required
                value={formRoll}
                onChange={e => setFormRoll(e.target.value)}
                placeholder="e.g. 23A91A0501"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. KARANAM PRANAV"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
              <select
                value={formBranch}
                onChange={e => setFormBranch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="CSE">CSE</option>
                <option value="AIML">AIML</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
              <select
                value={formSem}
                onChange={e => {
                  const s = e.target.value as any;
                  setFormSem(s);
                  setFormYear(s === '3' || s === '4' ? '2' : s === '5' || s === '6' ? '3' : '4');
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="3">Semester 3 (2nd Yr)</option>
                <option value="5">Semester 5 (3rd Yr)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                value={formSec}
                onChange={e => setFormSec(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Timetable Group (T1-T4)</label>
              <select
                value={formGroup}
                onChange={e => setFormGroup(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">None</option>
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="T3">T3</option>
                <option value="T4">T4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Minor Stream</label>
              <input
                type="text"
                value={formMinor}
                onChange={e => setFormMinor(e.target.value)}
                placeholder="e.g. Data Science Minor"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Excel Import Preview Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Confirm Excel Spreadsheet Import"
        subtitle={`Detected ${importPreviewData.length} records ready to import into MongoDB.`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="p-2">Roll Number</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Branch</th>
                  <th className="p-2">Sem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importPreviewData.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="p-2 font-mono font-bold">{r['Roll Number'] || r['rollNumber']}</td>
                    <td className="p-2">{r['Student Name'] || r['studentName']}</td>
                    <td className="p-2">{r['Branch'] || r['branch']}</td>
                    <td className="p-2">{r['Semester'] || r['semester']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Commit {importPreviewData.length} Records to MongoDB
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
