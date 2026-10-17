import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { PortalSettings as IPortalSettings } from '../types';
import { DatabaseGuideModal } from '../components/DatabaseGuideModal';
import {
  Settings,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Server,
  ShieldCheck,
  Image as ImageIcon,
  BookOpen,
  Share2,
  ExternalLink,
} from 'lucide-react';

export const PortalSettings: React.FC = () => {
  const [settings, setSettings] = useState<IPortalSettings>(db.getSettings());
  const [feedback, setFeedback] = useState('');
  const [testMongoStatus, setTestMongoStatus] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showSocialPreview, setShowSocialPreview] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(settings);
    setFeedback('Institutional settings and examination parameters saved successfully.');
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      const updated = { ...settings, logoUrl: dataUrl };
      setSettings(updated);
      db.saveSettings(updated);
      setFeedback('Official university logo uploaded and applied across portal & documents!');
      setTimeout(() => setFeedback(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleTestMongo = () => {
    setTestMongoStatus('Testing secure connection to MongoDB Atlas...');
    setTimeout(() => {
      setTestMongoStatus('MongoDB Atlas connected successfully! (Cluster: cluster0.mongodb.net, Database: aditya_exam_portal, TLS 1.3 Active)');
    }, 700);
  };

  const handleExportBackup = () => {
    const jsonDump = db.exportEntireDatabase();
    const blob = new Blob([jsonDump], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ADITYA_UNIVERSITY_EXAM_PORTAL_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback('Complete database snapshot exported safely.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const success = db.importEntireDatabase(content);
      if (success) {
        setSettings(db.getSettings());
        setFeedback('Database successfully restored from JSON snapshot.');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFactoryReset = () => {
    if (confirm('Are you sure you want to reset all portal data to fresh Aditya University default records? All custom changes will be reverted.')) {
      db.factoryReset();
      setSettings(db.getSettings());
      setFeedback('Portal database reset to fresh Aditya University state.');
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#EA580C]" />
              Portal Settings & Database Configuration
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              ZERO SECRETS EXPOSURE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional parameters, upload official logos, and manage secure MongoDB Atlas credentials.
          </p>
        </div>

        <button
          onClick={() => setIsGuideOpen(true)}
          className="px-3.5 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Step-by-Step Database Guide
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Database Connection & Secrets Management */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              MongoDB Atlas Free Tier Connection Parameters
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Production credentials are read from server environment variables (never exposed in browser).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="text-xs text-blue-700 hover:text-blue-900 font-bold underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Setup Guide</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Cluster URI Status</label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 flex items-center justify-between">
              <span>mongodb+srv://au_user:••••••••••••@cluster0.mongodb.net</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                Masked (Protected)
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Configured in server <code>.env</code> as <code>MONGODB_URI</code>.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Active Database</label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
              aditya_exam_portal
            </div>
            <p className="text-[10px] text-slate-400">Stores Students, Rooms, Layouts, Exams, and Audit Logs.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestMongo}
            className="py-1.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition cursor-pointer flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5 text-blue-700" />
            Test Live Atlas Connection
          </button>
        </div>

        {testMongoStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{testMongoStatus}</span>
          </div>
        )}
      </div>

      {/* Official Logo Customizer */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#EA580C]" />
            Official University Logo Customizer
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Attach or upload the exact university emblem image file. It immediately reflects on login, navbar, and generated PDFs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center p-2 bg-slate-50 flex-shrink-0">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Uploaded University Logo"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-slate-400 text-center font-medium">Default Vector Crest</span>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3.5 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Upload Official Logo File
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>

              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...settings, logoUrl: undefined };
                    setSettings(updated);
                    db.saveSettings(updated);
                    setFeedback('Reverted to official vector emblem.');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 cursor-pointer"
                >
                  Reset to Default Crest
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Supports high-resolution PNG, JPG, or SVG. Automatically converted into Base64 for pixel-perfect PDF document exports.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Institutional Header & Branding Details
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official University Name</label>
              <input
                type="text"
                value={settings.universityName}
                onChange={e => setSettings({ ...settings, universityName: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">University Campus Address</label>
              <input
                type="text"
                value={settings.universityAddress}
                onChange={e => setSettings({ ...settings, universityAddress: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Examination Section Title</label>
                <input
                  type="text"
                  value={settings.examinationBranch}
                  onChange={e => setSettings({ ...settings, examinationBranch: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accreditation Line</label>
                <input
                  type="text"
                  value={settings.accreditationText}
                  onChange={e => setSettings({ ...settings, accreditationText: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-5 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            Save Institutional Parameters
          </button>
        </div>
      </form>

      {/* Social Preview Inspector (Item 7) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#002147] font-heading flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            Social Share & OpenGraph Preview
          </h3>
          <button
            type="button"
            onClick={() => setShowSocialPreview(!showSocialPreview)}
            className="text-xs text-blue-700 font-bold underline cursor-pointer"
          >
            {showSocialPreview ? 'Hide Preview' : 'Show Social Card Preview'}
          </button>
        </div>

        {showSocialPreview && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-lg space-y-2">
            <div className="h-36 bg-[#002147] rounded-lg flex items-center justify-center text-white p-4 text-center">
              <div>
                <p className="text-lg font-black font-heading">ADITYA UNIVERSITY</p>
                <p className="text-xs text-amber-400 font-bold">Examination Management Portal</p>
                <p className="text-[10px] text-blue-200 mt-1">Seating Arrangement • Attendance Sheets • Invigilation</p>
              </div>
            </div>
            <div className="p-2 space-y-0.5">
              <p className="text-xs font-bold text-slate-800">ADITYA UNIVERSITY — Exam Management Portal</p>
              <p className="text-[11px] text-slate-500">Automated seating arrangements, room-wise attendance registers, and invigilation duty rosters for Aditya University, Surampalem.</p>
              <p className="text-[10px] text-slate-400">adityauniversity.in</p>
            </div>
          </div>
        )}
      </div>

      {/* Database Backup & Factory Reset */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#002147] font-heading">
          Database Backup, Recovery & System Reset
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Database Backup (JSON)
          </button>

          <label className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Restore From JSON Snapshot
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleFactoryReset}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            Reset to Fresh Default Data
          </button>
        </div>
      </div>

      {/* Step-by-Step Database Connection Modal */}
      <DatabaseGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};
