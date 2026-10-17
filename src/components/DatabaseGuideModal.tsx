import React from 'react';
import { Modal } from './Modal';
import { Database, CheckCircle2, ShieldAlert, Terminal, Key, Server, Copy, Globe, Eye, UploadCloud } from 'lucide-react';

interface DatabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseGuideModal: React.FC<DatabaseGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deployment & Database Guide: MongoDB Atlas & Vercel"
      subtitle="Complete guide to hosting on Vercel, connecting MongoDB Atlas, viewing via MongoDB Compass, and centralized logo storage."
      maxWidth="4xl"
    >
      <div className="space-y-6 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
        {/* Security & Zero Secrets Callout */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Zero-Secret Exposure Principle:</span> Never hardcode database connection strings, passwords, or authentication keys in frontend code or git commits. In Vercel, credentials are added via <em>Project Settings → Environment Variables</em>, completely isolated from client-side bundles.
          </div>
        </div>

        {/* Step 1: Create MongoDB Atlas Cluster */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#002147]">
            <span className="w-6 h-6 rounded-full bg-[#002147] text-white flex items-center justify-center text-xs">1</span>
            Create MongoDB Atlas Free Tier Cluster (M0)
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-slate-600">
            <li>Visit <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">mongodb.com/cloud/atlas</a> and register or log in.</li>
            <li>Click <strong>Create Deployment</strong> → Select the <strong>M0 Free Tier</strong> (512 MB storage, shared RAM, 100% free forever).</li>
            <li>Select a cloud provider and region close to your users (e.g., AWS <code>ap-south-1 Mumbai</code>).</li>
            <li>Name your cluster (e.g. <code>aditya-exam-cluster</code>) and click <strong>Create Deployment</strong>.</li>
          </ol>
        </div>

        {/* Step 2: Database User & Network Access */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#002147]">
            <span className="w-6 h-6 rounded-full bg-[#002147] text-white flex items-center justify-center text-xs">2</span>
            Create Database User & Allow Network Access
          </div>
          <p className="text-slate-600">
            In MongoDB Atlas sidebar under <strong>Security</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Database Access:</strong> Click <em>Add New Database User</em>. Choose <em>Password</em> authentication. Username: <code>au_admin</code>, Password: generate a strong password. Grant privilege: <em>Read and write to any database</em>.</li>
            <li><strong>Network Access:</strong> Click <em>Add IP Address</em> → Click <em>Allow Access From Anywhere</em> (<code>0.0.0.0/0</code>) so your Vercel serverless cloud deployment can connect without IP restrictions.</li>
          </ul>
        </div>

        {/* Step 3: View Collections via MongoDB Compass or Web UI */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#002147]">
            <span className="w-6 h-6 rounded-full bg-[#002147] text-white flex items-center justify-center text-xs">3</span>
            Viewing Database via MongoDB Compass
          </div>
          <p className="text-slate-600">
            To visually browse documents, inspect collections (Students, Rooms, Faculty, Seating, Invigilation, Settings):
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-600">
            <li>Download and launch <a href="https://www.mongodb.com/products/tools/compass" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">MongoDB Compass</a>.</li>
            <li>In Atlas, click <strong>Connect</strong> → <strong>Compass</strong> → Copy your connection string.</li>
            <li>Paste into Compass:
              <div className="mt-1.5 p-2 bg-slate-900 text-slate-100 rounded font-mono text-[11px] flex items-center justify-between">
                <span>mongodb+srv://au_admin:&lt;password&gt;@cluster0.mongodb.net/aditya_exam_portal</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('mongodb+srv://au_admin:<password>@cluster0.mongodb.net/aditya_exam_portal', 'compass')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer ml-2 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copied === 'compass' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </li>
            <li>Click <strong>Connect</strong>. You can now inspect, query, export, and manage every document directly in Compass.</li>
          </ol>
        </div>

        {/* Step 4: Hosting on Vercel without Local Server Dependencies */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#002147]">
            <span className="w-6 h-6 rounded-full bg-[#002147] text-white flex items-center justify-center text-xs">4</span>
            Deploying to Vercel (No Local Server Needed)
          </div>
          <p className="text-slate-600">
            When hosting on Vercel, your app runs entirely in the cloud with automated HTTPS and global CDN:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-600">
            <li>Push this repository to your GitHub account (e.g. <code>github.com/your-username/aditya-exam-portal</code>).</li>
            <li>Log into <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">vercel.com</a> and click <strong>Add New Project</strong> → Import your GitHub repository.</li>
            <li>Framework Preset: <strong>Vite</strong>. Build Command: <code>npm run build</code>. Output Directory: <code>dist</code>.</li>
            <li>Under <strong>Environment Variables</strong>, configure your private secrets:
              <div className="mt-2 p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded space-y-1">
                <div>MONGODB_URI = "mongodb+srv://au_admin:YOUR_PASS@cluster0.mongodb.net/aditya_exam_portal?retryWrites=true&w=majority"</div>
                <div>MONGODB_DATABASE = "aditya_exam_portal"</div>
                <div>NODE_ENV = "production"</div>
              </div>
            </li>
            <li>Click <strong>Deploy</strong>. Vercel automatically builds and provides an HTTPS URL (e.g. <code>aditya-exam-portal.vercel.app</code>) with HTTP/2 and auto-renewing SSL certificates.</li>
          </ol>
        </div>

        {/* Step 5: Official Logo Persistent Storage Workflow */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#002147]">
            <UploadCloud className="w-4 h-4 text-[#EA580C]" />
            Official University Logo System-Wide Persistence
          </div>
          <p className="text-slate-600">
            To ensure zero friction for examiners and faculty:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>The official Aditya University logo is configured once by the Admin in <strong>Portal Settings</strong>.</li>
            <li>When uploaded (PNG, JPG, or SVG), the image is saved directly into the database's <code>settings.logoUrl</code> record.</li>
            <li><strong>Automatic Inheritance:</strong> All PDF attendance sheets, room seating charts, invigilation duty rosters, and UI navigation bars automatically fetch this exact stored image. Faculties and examiners never have to upload or configure logos.</li>
          </ul>
        </div>

        {/* Step 6: Database Synchronization & Backup */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#002147]">
            <span className="w-6 h-6 rounded-full bg-[#002147] text-white flex items-center justify-center text-xs">5</span>
            Instant JSON Database Snapshots
          </div>
          <p className="text-slate-600">
            You can also create instant full-database snapshots from <strong>Portal Settings → Database Snapshot & Restore</strong>. You can download the complete state of students, buildings, rooms, timetables, and seating arrangements as a single JSON file and restore it on any deployment instantly.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </Modal>
  );
};
