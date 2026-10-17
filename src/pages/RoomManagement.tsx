import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { Room, Building } from '../types';
import { Modal } from '../components/Modal';
import {
  DoorOpen,
  Plus,
  Edit2,
  Trash2,
  LayoutGrid,
  CheckCircle2,
  Building2,
  Shield,
  Upload,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface RoomManagementProps {
  onNavigate: (module: string) => void;
}

export const RoomManagement: React.FC<RoomManagementProps> = ({ onNavigate }) => {
  const currentUser = db.getCurrentUser();
  const isAdmin = currentUser.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'rooms' | 'buildings'>(isAdmin ? 'buildings' : 'rooms');
  const [rooms, setRooms] = useState<Room[]>(() => db.getRooms());
  const [buildings, setBuildings] = useState<Building[]>(() => db.getBuildings());
  const [feedback, setFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

  // Building Modal State (Admin only)
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [buildingCode, setBuildingCode] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [buildingFloors, setBuildingFloors] = useState(4);
  const [buildingDeptAccess, setBuildingDeptAccess] = useState('CSE, AIML, IT');
  const [buildingDesc, setBuildingDesc] = useState('');

  // Room Modal State (Examiner / Admin)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formRoomNum, setFormRoomNum] = useState('');
  const [formBuildingId, setFormBuildingId] = useState('');
  const [formFloor, setFormFloor] = useState('1st Floor');
  const [formType, setFormType] = useState<'Regular Classroom' | 'Drawing Hall' | 'Seminar Hall' | 'Lab'>('Regular Classroom');
  const [formCols, setFormCols] = useState(4);
  const [formRows, setFormRows] = useState(6);

  // File Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Determine which buildings the examiner has access to
  // If admin: all buildings. If examiner: buildings matching assignedBuildingIds or department
  const permittedBuildings = isAdmin
    ? buildings
    : buildings.filter(b => {
        if (currentUser.assignedBuildingIds && currentUser.assignedBuildingIds.length > 0) {
          return currentUser.assignedBuildingIds.includes(b.id);
        }
        if (currentUser.department) {
          return b.departmentAccess.some(d => d.toUpperCase() === currentUser.department?.toUpperCase());
        }
        return true;
      });

  // Filter rooms based on permitted buildings for examiner
  const displayedRooms = isAdmin
    ? rooms
    : rooms.filter(r => {
        if (!r.buildingId) return true;
        return permittedBuildings.some(b => b.id === r.buildingId || b.name === r.building || b.code === r.building);
      });

  // --- Building Actions (Admin) ---
  const handleOpenAddBuilding = () => {
    setEditingBuilding(null);
    setBuildingCode('');
    setBuildingName('');
    setBuildingFloors(4);
    setBuildingDeptAccess('CSE, AIML');
    setBuildingDesc('');
    setIsBuildingModalOpen(true);
  };

  const handleOpenEditBuilding = (b: Building) => {
    setEditingBuilding(b);
    setBuildingCode(b.code);
    setBuildingName(b.name);
    setBuildingFloors(b.floorsCount);
    setBuildingDeptAccess(b.departmentAccess.join(', '));
    setBuildingDesc(b.description || '');
    setIsBuildingModalOpen(true);
  };

  const handleSaveBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingCode.trim() || !buildingName.trim()) {
      setErrorFeedback('Building code and name are required.');
      return;
    }

    const deptArray = buildingDeptAccess
      .split(',')
      .map(d => d.trim().toUpperCase())
      .filter(Boolean);

    const buildingToSave: Building = {
      id: editingBuilding ? editingBuilding.id : `bld_${Date.now()}`,
      code: buildingCode.trim().toUpperCase(),
      name: buildingName.trim(),
      floorsCount: Number(buildingFloors) || 1,
      departmentAccess: deptArray.length > 0 ? deptArray : ['GENERAL'],
      description: buildingDesc.trim(),
      createdAt: editingBuilding?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveBuilding(buildingToSave);
    setBuildings(db.getBuildings());
    setIsBuildingModalOpen(false);
    setFeedback(`Building "${buildingToSave.name} (${buildingToSave.code})" successfully saved.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleDeleteBuilding = (b: Building) => {
    if (confirm(`Are you sure you want to delete building "${b.name}"? This action cannot be undone.`)) {
      db.deleteBuilding(b.id);
      setBuildings(db.getBuildings());
      setFeedback(`Building "${b.name}" deleted.`);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  // --- Room Actions (Examiner / Admin) ---
  const handleOpenAddRoom = () => {
    if (permittedBuildings.length === 0) {
      setErrorFeedback('No permitted buildings available. Admin must configure buildings first.');
      return;
    }
    setEditingRoom(null);
    setFormBuildingId(permittedBuildings[0].id);
    setFormRoomNum(`${permittedBuildings[0].code} 101`);
    setFormFloor('1st Floor');
    setFormType('Regular Classroom');
    setFormCols(4);
    setFormRows(6);
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (r: Room) => {
    setEditingRoom(r);
    setFormRoomNum(r.roomNumber);
    const bld = buildings.find(b => b.id === r.buildingId || b.name === r.building || b.code === r.building);
    setFormBuildingId(bld ? bld.id : permittedBuildings[0]?.id || '');
    setFormFloor(r.floor);
    setFormType(r.roomType);
    setFormCols(r.columnsCount);
    setFormRows(r.rowsCount);
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoomNum.trim()) {
      setErrorFeedback('Room number is required.');
      return;
    }

    const selectedBuilding = buildings.find(b => b.id === formBuildingId) || permittedBuildings[0];
    const totalSeats = formCols * formRows * 3;

    const roomToSave: Room = {
      id: editingRoom ? editingRoom.id : `rm_${Date.now()}`,
      buildingId: selectedBuilding?.id,
      building: selectedBuilding?.name || 'Academic Block',
      roomNumber: formRoomNum.trim().toUpperCase(),
      floor: formFloor,
      roomType: formType,
      columnsCount: formCols,
      rowsCount: formRows,
      totalCapacity: totalSeats,
      usableCapacity: totalSeats,
      blockedSeatsCount: 0,
      isActive: true,
      layoutRevision: (editingRoom?.layoutRevision || 0) + 1,
      layout: editingRoom?.layout || {
        columnsCount: formCols,
        benchesPerColumn: Array(formCols).fill(formRows),
        seatsPerBenchDefault: 3,
        benches: [],
        revision: 1,
      },
      createdAt: editingRoom?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveRoom(roomToSave);
    setRooms(db.getRooms());
    setIsRoomModalOpen(false);
    setFeedback(`Room "${roomToSave.roomNumber}" saved successfully with ${roomToSave.usableCapacity} usable seats.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleDeleteRoom = (id: string, roomNum: string) => {
    if (confirm(`Are you sure you want to delete room ${roomNum}?`)) {
      db.deleteRoom(id);
      setRooms(db.getRooms());
      setFeedback(`Room ${roomNum} deleted.`);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  // CSV / Excel Template Download & Upload
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Room Number': 'RTB 201',
        'Building Code': 'RTB',
        Floor: '2nd Floor',
        'Room Type': 'Regular Classroom',
        'Columns Count': 4,
        'Benches Per Column': 6,
      },
      {
        'Room Number': 'RTB 202',
        'Building Code': 'RTB',
        Floor: '2nd Floor',
        'Room Type': 'Regular Classroom',
        'Columns Count': 4,
        'Benches Per Column': 6,
      },
      {
        'Room Number': 'CB 301',
        'Building Code': 'CB',
        Floor: '3rd Floor',
        'Room Type': 'Drawing Hall',
        'Columns Count': 5,
        'Benches Per Column': 6,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RoomsTemplate');
    XLSX.writeFile(wb, 'Aditya_University_Rooms_Template.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        let importedCount = 0;
        data.forEach((row: any) => {
          const roomNum = row['Room Number'] || row['roomNumber'] || row['Room'];
          if (!roomNum) return;

          const bldCode = (row['Building Code'] || row['Building'] || '').toUpperCase();
          const matchedBld = buildings.find(b => b.code === bldCode || b.name.toUpperCase().includes(bldCode)) || permittedBuildings[0];

          const cols = Number(row['Columns Count'] || row['columns'] || 4);
          const rows = Number(row['Benches Per Column'] || row['rows'] || 6);
          const totalSeats = cols * rows * 3;

          const newRoom: Room = {
            id: `rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            buildingId: matchedBld?.id,
            building: matchedBld?.name || 'Academic Block',
            roomNumber: String(roomNum).trim().toUpperCase(),
            floor: row['Floor'] || '1st Floor',
            roomType: (row['Room Type'] as any) || 'Regular Classroom',
            columnsCount: cols,
            rowsCount: rows,
            totalCapacity: totalSeats,
            usableCapacity: totalSeats,
            blockedSeatsCount: 0,
            isActive: true,
            layoutRevision: 1,
            layout: {
              columnsCount: cols,
              benchesPerColumn: Array(cols).fill(rows),
              seatsPerBenchDefault: 3,
              benches: [],
              revision: 1,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          db.saveRoom(newRoom);
          importedCount++;
        });

        setRooms(db.getRooms());
        setIsUploadModalOpen(false);
        setFeedback(`Successfully imported ${importedCount} examination halls.`);
        setTimeout(() => setFeedback(''), 5000);
      } catch (err) {
        setErrorFeedback(`Import failed: ${(err as Error).message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-5 antialiased">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-[#EA580C]" />
              Infrastructure & Examination Halls
            </h1>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-sm border border-slate-200">
              {displayedRooms.length} ROOMS CONFIGURED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin provisions campus buildings. Examiners configure halls, seating rows, and 3-seat benches in their assigned blocks.
          </p>
        </div>

        {/* Tab selection & role context */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('buildings')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'buildings'
                    ? 'bg-[#002147] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Buildings (Admin)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rooms')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'rooms'
                    ? 'bg-[#002147] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Rooms & Halls</span>
              </button>
            </div>
          )}

          {activeTab === 'buildings' && isAdmin ? (
            <button
              type="button"
              onClick={handleOpenAddBuilding}
              className="px-3.5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Building Block</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV / Excel</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddRoom}
                className="px-3.5 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Room Manually</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role Access Banner for Examiner */}
      {!isAdmin && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-700 flex-shrink-0" />
            <div>
              <span className="font-bold">Examiner Access Control:</span> You are managing rooms for permitted block(s):{' '}
              <span className="font-extrabold text-[#002147]">
                {permittedBuildings.length > 0
                  ? permittedBuildings.map(b => `${b.code} (${b.name})`).join(', ')
                  : 'No blocks assigned yet by Admin'}
              </span>{' '}
              ({currentUser.department || 'Allotted'} Department).
            </div>
          </div>
          <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded whitespace-nowrap">
            Full Room Control
          </span>
        </div>
      )}

      {/* Feedback Messages */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorFeedback && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* TAB 1: BUILDINGS MANAGEMENT (Admin creates buildings) */}
      {activeTab === 'buildings' && isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-[#002147]">Campus Buildings & Blocks Directory</h2>
              <p className="text-[11px] text-slate-500">
                Created by Admin. Departmental access permissions dictate which blocks examiners can control.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{buildings.length} Buildings</span>
          </div>

          <table className="w-full text-xs text-left">
            <thead className="bg-[#002147] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Building Code</th>
                <th className="py-2.5 px-3">Building Name</th>
                <th className="py-2.5 px-3">Department Access</th>
                <th className="py-2.5 px-3 text-center">Floors</th>
                <th className="py-2.5 px-3 text-center">Total Rooms</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {buildings.map(b => {
                const bldRooms = rooms.filter(r => r.buildingId === b.id || r.building === b.name || r.building === b.code);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-blue-900 font-mono text-sm">{b.code}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{b.name}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {b.departmentAccess.map(dept => (
                          <span
                            key={dept}
                            className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700 font-semibold">{b.floorsCount} Floors</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        {bldRooms.length} Halls
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{b.description || '—'}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditBuilding(b)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition cursor-pointer"
                          title="Edit Building"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBuilding(b)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          title="Delete Building"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ROOMS & HALLS (Controlled by Examiner / viewed by Admin) */}
      {(activeTab === 'rooms' || !isAdmin) && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-[#002147]">
                Examination Rooms & Halls Register
              </h2>
              <p className="text-[11px] text-slate-500">
                Configured with 3-seat bench default. Columns, rows, and usable capacity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('layout_designer')}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-blue-200 cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Visual 2D Layout Designer</span>
              </button>
            </div>
          </div>

          {displayedRooms.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <DoorOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Examination Halls Configured Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No rooms have been added for this block. You can create rooms individually or upload an Excel/CSV file with your room codes and bench grids.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleOpenAddRoom}
                  className="px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Room Manually</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Spreadsheet</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#002147] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Room Number</th>
                    <th className="py-2.5 px-3">Building / Block</th>
                    <th className="py-2.5 px-3">Floor</th>
                    <th className="py-2.5 px-3">Room Type</th>
                    <th className="py-2.5 px-3 text-center">Bench Columns</th>
                    <th className="py-2.5 px-3 text-center">Total Capacity</th>
                    <th className="py-2.5 px-3 text-center">Usable Seats</th>
                    <th className="py-2.5 px-3 text-center">Blocked Seats</th>
                    <th className="py-2.5 px-3 text-center">Revision</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedRooms.map(room => (
                    <tr key={room.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-bold text-blue-900 font-mono text-sm">{room.roomNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{room.building}</td>
                      <td className="py-2.5 px-3 text-slate-600">{room.floor}</td>
                      <td className="py-2.5 px-3 text-slate-600">{room.roomType}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-bold">
                        {room.columnsCount} Columns
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {room.totalCapacity}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {room.usableCapacity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {room.blockedSeatsCount > 0 ? (
                          <span className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                            {room.blockedSeatsCount} Blocked
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        v{room.layoutRevision}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigate('layout_designer')}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition cursor-pointer"
                            title="Open Visual 2D Layout Designer"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoom(room)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            title="Edit Room Parameters"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Delete Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT BUILDING (Admin only) */}
      <Modal
        isOpen={isBuildingModalOpen}
        onClose={() => setIsBuildingModalOpen(false)}
        title={editingBuilding ? `Edit Building: ${editingBuilding.code}` : 'Add New Campus Building Block'}
        subtitle="Admin specifies building block code, name, and authorized departmental branches."
      >
        <form onSubmit={handleSaveBuilding} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Building Code *</label>
              <input
                type="text"
                required
                value={buildingCode}
                onChange={e => setBuildingCode(e.target.value.toUpperCase())}
                placeholder="e.g. RTB"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Floors Count</label>
              <input
                type="number"
                min={1}
                max={12}
                value={buildingFloors}
                onChange={e => setBuildingFloors(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Building Name *</label>
            <input
              type="text"
              required
              value={buildingName}
              onChange={e => setBuildingName(e.target.value)}
              placeholder="e.g. Ramanujan Technology Bhavan"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Department Branch Access (comma separated)
            </label>
            <input
              type="text"
              value={buildingDeptAccess}
              onChange={e => setBuildingDeptAccess(e.target.value)}
              placeholder="e.g. CSE, AIML, IT"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Examiners assigned to these branches will have full authority over rooms inside this building block.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Location Notes</label>
            <textarea
              rows={2}
              value={buildingDesc}
              onChange={e => setBuildingDesc(e.target.value)}
              placeholder="e.g. Main Computing and AI Block adjacent to Central Library"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBuildingModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
            >
              Save Building Block
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD / EDIT ROOM (Examiner / Admin) */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title={editingRoom ? `Edit Hall: ${editingRoom.roomNumber}` : 'Add Examination Room'}
        subtitle="Set hall code, building block, floor level, and column layout grid."
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Building Block *</label>
              <select
                value={formBuildingId}
                onChange={e => {
                  setFormBuildingId(e.target.value);
                  const b = buildings.find(bld => bld.id === e.target.value);
                  if (b && !editingRoom) {
                    setFormRoomNum(`${b.code} 101`);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              >
                {permittedBuildings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room Code / Number *</label>
              <input
                type="text"
                required
                value={formRoomNum}
                onChange={e => setFormRoomNum(e.target.value.toUpperCase())}
                placeholder="e.g. RTB 201"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Floor Level</label>
              <select
                value={formFloor}
                onChange={e => setFormFloor(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              >
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room Type</label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              >
                <option value="Regular Classroom">Regular Classroom</option>
                <option value="Drawing Hall">Drawing Hall</option>
                <option value="Seminar Hall">Seminar Hall</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Number of Bench Columns</label>
              <input
                type="number"
                min={2}
                max={8}
                value={formCols}
                onChange={e => setFormCols(parseInt(e.target.value, 10) || 4)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Benches per Column (Rows)</label>
              <input
                type="number"
                min={2}
                max={15}
                value={formRows}
                onChange={e => setFormRows(parseInt(e.target.value, 10) || 6)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-700" />
              <span>Calculated Usable Capacity</span>
            </div>
            <p>
              {formCols} columns × {formRows} benches = <strong>{formCols * formRows} benches</strong>.
              At 3 seats per bench (standard Aditya University format), baseline capacity ={' '}
              <span className="font-black text-[#002147] text-sm">{formCols * formRows * 3} seats</span>.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRoomModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
            >
              Save Examination Room
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: UPLOAD CSV / EXCEL MODAL */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Examination Halls Spreadsheet"
        subtitle="Import rooms in bulk using Excel (.xlsx, .xls) or CSV files."
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Need a sample format?</p>
              <p className="text-[11px] text-slate-500">Download our pre-structured Excel template.</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Excel or CSV Spreadsheet
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs cursor-pointer focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Columns expected: <code>Room Number</code>, <code>Building Code</code>, <code>Floor</code>, <code>Room Type</code>, <code>Columns Count</code>, <code>Benches Per Column</code>.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
