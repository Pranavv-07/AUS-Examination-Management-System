import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { Room, BenchConfig, SeatConfig } from '../types';
import {
  DoorOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Ban,
  CheckCircle2,
  Sparkles,
  Layers,
  Info,
  Sliders,
} from 'lucide-react';

export const RoomLayoutDesigner: React.FC = () => {
  const rooms = db.getRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const activeRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  // Working copy of layout for unsaved edits
  const [columnsCount, setColumnsCount] = useState<number>(activeRoom?.columnsCount || 4);
  const [benchesPerColumn, setBenchesPerColumn] = useState<number[]>(
    activeRoom?.layout?.benchesPerColumn || [6, 6, 6, 6]
  );
  const [benches, setBenches] = useState<BenchConfig[]>(activeRoom?.layout?.benches || []);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedSeat, setSelectedSeat] = useState<{ benchId: string; seatIndex: number } | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Switch room
  const handleSelectRoom = (roomId: string) => {
    const r = rooms.find(item => item.id === roomId);
    if (!r) return;
    setSelectedRoomId(roomId);
    setColumnsCount(r.columnsCount);
    setBenchesPerColumn(r.layout.benchesPerColumn);
    setBenches(JSON.parse(JSON.stringify(r.layout.benches)));
    setSelectedSeat(null);
    setSaveSuccessMessage('');
  };

  // Re-calculate live stats
  const totalSeats = benches.reduce((acc, b) => acc + b.seatsCount, 0);
  const blockedSeats = benches.reduce(
    (acc, b) => acc + b.seats.filter(s => s.isBlocked || s.targetGroup === 'BLOCKED').length,
    0
  );
  const usableCapacity = totalSeats - blockedSeats;
  const sem3Seats = benches.reduce(
    (acc, b) => acc + b.seats.filter(s => s.targetGroup === '3' && !s.isBlocked).length,
    0
  );
  const sem5Seats = benches.reduce(
    (acc, b) => acc + b.seats.filter(s => s.targetGroup === '5' && !s.isBlocked).length,
    0
  );

  // Apply batch pattern to entire room (e.g., 3-5-3 or 5-3-5)
  const applyPresetPattern = (patternType: '3-5-3' | '5-3-5' | 'ALL_3' | 'ALL_5') => {
    const updated = benches.map(bench => {
      const isAlt = bench.rowIndex % 2 === 1;
      const pattern =
        patternType === '3-5-3'
          ? isAlt ? ['5', '3', '5'] : ['3', '5', '3']
          : patternType === '5-3-5'
          ? isAlt ? ['3', '5', '3'] : ['5', '3', '5']
          : patternType === 'ALL_3'
          ? ['3', '3', '3']
          : ['5', '5', '5'];

      const updatedSeats = bench.seats.map((seat, idx) => {
        if (seat.isBlocked) return seat;
        return {
          ...seat,
          targetGroup: (pattern[idx] || 'ANY') as '3' | '5' | 'ANY',
        };
      });

      return { ...bench, seats: updatedSeats };
    });

    setBenches(updated);
  };

  // Toggle seat state or cycle group
  const handleSeatClick = (benchId: string, seatIndex: number) => {
    setSelectedSeat({ benchId, seatIndex });
  };

  const updateSelectedSeatGroup = (group: '3' | '5' | 'ANY' | 'BLOCKED') => {
    if (!selectedSeat) return;
    const { benchId, seatIndex } = selectedSeat;

    const updated = benches.map(bench => {
      if (bench.benchId === benchId) {
        const seats = [...bench.seats];
        const isBlocked = group === 'BLOCKED';
        seats[seatIndex] = {
          ...seats[seatIndex],
          targetGroup: group,
          isBlocked,
          notes: isBlocked ? 'Blocked by Examiner' : undefined,
        };
        return { ...bench, seats };
      }
      return bench;
    });

    setBenches(updated);
  };

  // Add column
  const handleAddColumn = () => {
    if (columnsCount >= 6) return;
    const newColIdx = columnsCount;
    const newColBenchCount = benchesPerColumn[0] || 6;
    const newBenchesPerCol = [...benchesPerColumn, newColBenchCount];

    let benchNum = benches.length + 1;
    const newColBenches: BenchConfig[] = [];
    for (let r = 0; r < newColBenchCount; r++) {
      const isAlt = r % 2 === 1;
      const pattern = isAlt ? ['5', '3', '5'] : ['3', '5', '3'];
      newColBenches.push({
        benchId: `B-C${newColIdx + 1}-R${r + 1}`,
        colIndex: newColIdx,
        rowIndex: r,
        benchNumber: benchNum++,
        seatsCount: 3,
        seats: [
          { seatIndex: 0, targetGroup: pattern[0] as '3' | '5', isBlocked: false },
          { seatIndex: 1, targetGroup: pattern[1] as '3' | '5', isBlocked: false },
          { seatIndex: 2, targetGroup: pattern[2] as '3' | '5', isBlocked: false },
        ],
      });
    }

    setColumnsCount(columnsCount + 1);
    setBenchesPerColumn(newBenchesPerCol);
    setBenches([...benches, ...newColBenches]);
  };

  // Remove last column
  const handleRemoveColumn = () => {
    if (columnsCount <= 2) return;
    const lastColIdx = columnsCount - 1;
    setColumnsCount(columnsCount - 1);
    setBenchesPerColumn(benchesPerColumn.slice(0, lastColIdx));
    setBenches(benches.filter(b => b.colIndex !== lastColIdx));
  };

  // Save layout revision to database
  const handleSaveLayout = () => {
    if (!activeRoom) return;

    const updatedRoom: Room = {
      ...activeRoom,
      columnsCount,
      totalCapacity: totalSeats,
      usableCapacity,
      blockedSeatsCount: blockedSeats,
      layoutRevision: (activeRoom.layoutRevision || 1) + 1,
      layout: {
        columnsCount,
        benchesPerColumn,
        seatsPerBenchDefault: 3,
        benches,
        revision: (activeRoom.layoutRevision || 1) + 1,
        notes: `Revised layout with ${usableCapacity} usable seats. 3rd Sem: ${sem3Seats}, 5th Sem: ${sem5Seats}.`,
      },
    };

    db.saveRoom(updatedRoom);
    setSaveSuccessMessage(`Layout Revision #${updatedRoom.layoutRevision} saved successfully in MongoDB!`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Room Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#002147] font-heading flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-[#EA580C]" />
              Visual Room Layout Designer
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
              3-SEATS PER BENCH
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive top-down diagram with bench-level 3rd semester (2nd yr) and 5th semester (3rd yr) student separation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Select Room:</label>
            <select
              value={selectedRoomId}
              onChange={e => handleSelectRoom(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} — {r.building.split(' ')[0]} ({r.usableCapacity} Seats)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveLayout}
            className="px-3.5 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            Save Revision #{activeRoom.layoutRevision + 1}
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveSuccessMessage}
        </div>
      )}

      {/* Main Designer Grid: Sidebar Controls + Top-Down Room Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Column: Layout Controls & Statistics */}
        <div className="space-y-4">
          {/* Capacity Metrics */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#002147] uppercase tracking-wider flex items-center gap-1.5 font-heading">
              <Layers className="w-3.5 h-3.5 text-[#EA580C]" />
              Live Room Capacity
            </h3>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Capacity</span>
                <p className="text-xl font-black text-blue-900 font-heading">{totalSeats}</p>
              </div>
              <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold">Usable Seats</span>
                <p className="text-xl font-black text-emerald-900 font-heading">{usableCapacity}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                  Sem 3 (2nd Year) Target:
                </span>
                <span className="font-bold text-slate-800">{sem3Seats} seats</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                  Sem 5 (3rd Year) Target:
                </span>
                <span className="font-bold text-slate-800">{sem5Seats} seats</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  Blocked / Damaged Seats:
                </span>
                <span className="font-bold text-rose-600">{blockedSeats} seats</span>
              </div>
            </div>
          </div>

          {/* Mixing Pattern Presets */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-[#002147] uppercase tracking-wider flex items-center gap-1.5 font-heading">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Academic Year Mixing Presets
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              Based on handwritten examination rules, mix 3rd and 5th semester students on 3-seat benches.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPresetPattern('3-5-3')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">3 - 5 - 3</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1 rounded">Default</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">2nd | 3rd | 2nd Year</p>
              </button>

              <button
                onClick={() => applyPresetPattern('5-3-5')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">5 - 3 - 5</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1 rounded">Alt</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">3rd | 2nd | 3rd Year</p>
              </button>
            </div>
          </div>

          {/* Selected Seat Editor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#002147] uppercase tracking-wider flex items-center gap-1.5 font-heading">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Selected Seat Inspector
            </h3>

            {selectedSeat ? (
              <div className="space-y-2.5">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Bench ID:</span>{' '}
                  <span className="font-bold text-slate-800">{selectedSeat.benchId}</span>
                  <br />
                  <span className="text-slate-500 font-medium">Seat Slot:</span>{' '}
                  <span className="font-bold text-slate-800">Position #{selectedSeat.seatIndex + 1} (of 3)</span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-600">Assign Target Student Group:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => updateSelectedSeatGroup('3')}
                      className="px-2.5 py-1.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      '3' (2nd Year)
                    </button>
                    <button
                      onClick={() => updateSelectedSeatGroup('5')}
                      className="px-2.5 py-1.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                    >
                      '5' (3rd Year)
                    </button>
                    <button
                      onClick={() => updateSelectedSeatGroup('ANY')}
                      className="px-2.5 py-1.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
                    >
                      ANY
                    </button>
                    <button
                      onClick={() => updateSelectedSeatGroup('BLOCKED')}
                      className="px-2.5 py-1.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      Block Seat
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Click any seat slot in the room diagram to inspect or block.
              </p>
            )}
          </div>

          {/* Grid Dimension Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hall Columns</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemoveColumn}
                disabled={columnsCount <= 2}
                className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded text-slate-700 transition cursor-pointer"
              >
                - Col ({columnsCount})
              </button>
              <button
                onClick={handleAddColumn}
                disabled={columnsCount >= 6}
                className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded text-slate-700 transition cursor-pointer"
              >
                + Col ({columnsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Right 3 Columns: Visual Top-Down Room Blueprint */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Canvas Toolbar */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  3
                </span>
                <span>Semester 3 (2nd Year)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  5
                </span>
                <span>Semester 5 (3rd Year)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  ✕
                </span>
                <span>Blocked / Broken Seat</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-700 px-1.5">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                title="Fit to Normal"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Top-Down Visual Blueprint Area */}
          <div className="p-6 overflow-auto flex-1 bg-slate-100/50 min-h-[500px] flex justify-center">
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              className="transition-transform duration-100 space-y-6"
            >
              {/* Blackboard / Invigilator Podium Front Header */}
              <div className="w-full bg-[#002147] text-white py-2 px-6 rounded-lg text-center shadow-xs">
                <p className="text-xs font-black tracking-widest uppercase font-heading">
                  BLACKBOARD / TEACHER'S PODIUM / INVIGILATOR DESK (FRONT)
                </p>
                <p className="text-[10px] text-slate-300">
                  Room: {activeRoom.roomNumber} • {activeRoom.building} • Floor: {activeRoom.floor}
                </p>
              </div>

              {/* Columns of Benches */}
              <div className="flex items-start gap-8 justify-center">
                {Array.from({ length: columnsCount }).map((_, colIdx) => {
                  const colBenches = benches
                    .filter(b => b.colIndex === colIdx)
                    .sort((a, b) => a.rowIndex - b.rowIndex);

                  return (
                    <div key={colIdx} className="space-y-4 flex flex-col items-center">
                      <div className="text-[11px] font-black uppercase text-slate-600 tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
                        Column {colIdx + 1}
                      </div>

                      <div className="space-y-3">
                        {colBenches.map(bench => (
                          <div
                            key={bench.benchId}
                            className="bg-white p-2 rounded-xl border border-slate-300 shadow-sm hover:border-blue-400 transition w-56 select-none"
                          >
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1.5 px-1">
                              <span>Bench {bench.benchNumber}</span>
                              <span className="text-[9px] text-slate-400">Row {bench.rowIndex + 1}</span>
                            </div>

                            {/* 3 Seats inside Bench */}
                            <div className="grid grid-cols-3 gap-1.5">
                              {bench.seats.map((seat, sIdx) => {
                                const isSelected =
                                  selectedSeat?.benchId === bench.benchId &&
                                  selectedSeat?.seatIndex === sIdx;
                                const isBlocked = seat.isBlocked || seat.targetGroup === 'BLOCKED';

                                let badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
                                if (seat.targetGroup === '3') {
                                  badgeBg = 'bg-blue-600 text-white border-blue-700';
                                } else if (seat.targetGroup === '5') {
                                  badgeBg = 'bg-amber-500 text-white border-amber-600';
                                } else if (isBlocked) {
                                  badgeBg = 'bg-rose-500 text-white border-rose-600';
                                }

                                return (
                                  <button
                                    key={sIdx}
                                    onClick={() => handleSeatClick(bench.benchId, sIdx)}
                                    className={`py-2 px-1 rounded-lg text-center border font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center relative ${badgeBg} ${
                                      isSelected
                                        ? 'ring-2 ring-indigo-500 ring-offset-1 shadow-md scale-105'
                                        : 'hover:opacity-90'
                                    }`}
                                  >
                                    <span className="text-[9px] opacity-80 leading-none">Seat {sIdx + 1}</span>
                                    <span className="text-sm font-black mt-0.5 leading-none">
                                      {isBlocked ? '✕' : seat.targetGroup}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rear Room Entry / Exit indication */}
              <div className="text-center py-2 border-t border-dashed border-slate-300 text-slate-400 text-xs font-semibold">
                ▲ REAR ENTRANCE / EXIT DOOR ▲
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
