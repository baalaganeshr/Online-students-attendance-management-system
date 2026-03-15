import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, AlertTriangle, MessageSquare, MapPin, Search, ChevronDown, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { store, Student, AttendanceRecord, SmsLog } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<'attendance' | 'sms'>('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [absentModal, setAbsentModal] = useState<{ isOpen: boolean; student: Student | null; reason: string }>({
    isOpen: false,
    student: null,
    reason: ''
  });

  useEffect(() => {
    setStudents(store.getStudents());
    loadData(date);
    // Poll for updates since it's local storage and might be updated from another tab/component
    const interval = setInterval(() => loadData(date), 2000);
    return () => clearInterval(interval);
  }, [date]);

  const loadData = (selectedDate: string) => {
    setRecords(store.getAttendance(selectedDate));
    setSmsLogs(store.getSmsLogs());
  };

  const getStudentStatus = (studentId: string) => {
    return records.find(r => r.studentId === studentId);
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const unmarkedCount = students.length - records.length;

  const confirmMarkAbsent = () => {
    const { student, reason } = absentModal;
    if (!student) return;

    store.markAttendance({
      studentId: student.id,
      date: date,
      timestamp: Date.now(),
      status: 'Absent',
      distanceMeters: 0,
      lat: 0,
      lng: 0,
      reason: reason.trim() || 'Marked absent by administrator'
    });

    const portalLink = window.location.origin;
    const dateFormatted = format(new Date(date), 'dd MMM yyyy');
    const reasonText = reason.trim() ? ` Reason: ${reason.trim()}.` : '';
    
    store.logSms({
      studentId: student.id,
      phone: student.parentPhone,
      message: `Dear Parent, your ward ${student.name} has been marked ABSENT on ${dateFormatted}.${reasonText} View portal: ${portalLink}`,
      timestamp: Date.now()
    });

    loadData(date);
    setAbsentModal({ isOpen: false, student: null, reason: '' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-2 font-medium">Mahalakshmi Women's College of Arts and Science</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-zinc-500">
            Date
          </div>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none text-zinc-900 font-semibold text-sm cursor-pointer hover:bg-zinc-100 transition-colors focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col p-6 rounded-3xl bg-emerald-50 border border-emerald-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <p className="text-sm font-semibold text-emerald-800">Present Today</p>
          </div>
          <p className="text-6xl font-bold tracking-tighter text-emerald-950">{presentCount}</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col p-6 rounded-3xl bg-red-50 border border-red-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <p className="text-sm font-semibold text-red-800">Absent / Out of Bounds</p>
          </div>
          <p className="text-6xl font-bold tracking-tighter text-red-950">{absentCount}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col p-6 rounded-3xl bg-zinc-50 border border-zinc-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-400"></div>
            <p className="text-sm font-semibold text-zinc-600">Not Yet Marked</p>
          </div>
          <p className="text-6xl font-bold tracking-tighter text-zinc-900">{unmarkedCount}</p>
        </motion.div>
      </div>

      <div>
        <div className="flex gap-8 border-b border-zinc-200 mb-8">
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === 'attendance' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'}`}
          >
            Attendance Roster
            {activeTab === 'attendance' && (
              <motion.span layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 rounded-t-full"></motion.span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('sms')}
            className={`pb-4 text-sm font-bold transition-colors relative flex items-center gap-2 ${activeTab === 'sms' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'}`}
          >
            <MessageSquare className="w-4 h-4" /> SMS Logs
            {activeTab === 'sms' && (
              <motion.span layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 rounded-t-full"></motion.span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'attendance' && (
            <motion.div 
              key="attendance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col"
            >
              <div className="mb-8">
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students or departments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-8 pr-4 py-3 bg-transparent border-b border-zinc-200 text-base placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors font-medium"
                  />
                </div>
              </div>
              <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="py-4 pr-4 w-10 border-b border-zinc-200"></th>
                      <th className="py-4 pr-4 text-xs font-bold text-zinc-500 border-b border-zinc-200 uppercase tracking-wider">Student Name</th>
                      <th className="py-4 pr-4 text-xs font-bold text-zinc-500 border-b border-zinc-200 uppercase tracking-wider">Status</th>
                      <th className="py-4 pr-4 text-xs font-bold text-zinc-500 border-b border-zinc-200 uppercase tracking-wider">Location Info</th>
                      <th className="py-4 text-xs font-bold text-zinc-500 border-b border-zinc-200 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-500 text-sm font-medium">
                          No students found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const record = getStudentStatus(student.id);
                        const isExpanded = expandedStudentId === student.id;
                        return (
                          <React.Fragment key={student.id}>
                            <tr 
                              onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                              className={`transition-colors cursor-pointer group ${
                                record?.status === 'Absent' ? 'bg-red-50/50 hover:bg-red-50/80' : 'hover:bg-zinc-50/50'
                              }`}
                            >
                              <td className="py-4 pr-4 pl-2 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                                  <ChevronRight className="w-4 h-4" />
                                </motion.div>
                              </td>
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-zinc-900">{student.name}</span>
                                  {record?.status === 'Absent' && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Marked Absent"></div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                {record ? (
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                    record.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {record.status}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-100 text-zinc-600">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-4 pr-4">
                                {record ? (
                                  <div className="flex items-center gap-1.5 text-sm text-zinc-600 font-medium">
                                    <MapPin className="w-4 h-4 text-zinc-400" />
                                    {(record.distanceMeters / 1000).toFixed(2)} km
                                  </div>
                                ) : (
                                  <span className="text-zinc-400 text-sm">-</span>
                                )}
                              </td>
                              <td className="py-4 text-sm text-zinc-600 font-mono font-medium">
                                {record ? format(record.timestamp, 'HH:mm:ss') : '-'}
                              </td>
                            </tr>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.tr 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className={record?.status === 'Absent' ? 'bg-red-50/30' : 'bg-zinc-50/50'}
                                >
                              <td colSpan={5} className="py-8 pl-14 pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
                                  <div className="space-y-5">
                                    <div>
                                      <span className="block text-xs font-medium text-slate-500 mb-1">Student ID</span>
                                      <span className="text-slate-900 font-mono">{student.id}</span>
                                    </div>
                                    <div>
                                      <span className="block text-xs font-medium text-slate-500 mb-1">Department</span>
                                      <span className="text-slate-900">{student.department}</span>
                                    </div>
                                    <div>
                                      <span className="block text-xs font-medium text-slate-500 mb-1">Parent Phone</span>
                                      <span className="text-slate-900 font-mono">{student.parentPhone}</span>
                                    </div>
                                    {record && (
                                      <div>
                                        <span className="block text-xs font-medium text-slate-500 mb-1">GPS Coordinates</span>
                                        <span className="text-slate-900 font-mono">
                                          {record.lat.toFixed(6)}, {record.lng.toFixed(6)}
                                        </span>
                                      </div>
                                    )}
                                    {record?.reason && (
                                      <div>
                                        <span className="block text-xs font-medium text-slate-500 mb-1">Reason for Absence</span>
                                        <span className="text-slate-900 italic">
                                          "{record.reason}"
                                        </span>
                                      </div>
                                    )}
                                    {(!record || record.status === 'Present') && (
                                      <div className="pt-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAbsentModal({ isOpen: true, student, reason: '' });
                                          }}
                                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors"
                                        >
                                          <AlertTriangle className="w-4 h-4" />
                                          Mark Absent
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {record?.photoUrl && (
                                    <div className="lg:col-span-3">
                                      <span className="block text-xs font-medium text-slate-500 mb-2">Identity Verification</span>
                                      <div className="rounded-xl overflow-hidden border border-slate-200 inline-block bg-white p-1 shadow-sm">
                                        <img 
                                          src={record.photoUrl} 
                                          alt={`Verification for ${student.name}`} 
                                          className="h-40 w-auto object-cover rounded-lg"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
            </table>
          </div>
        </div>
        </motion.div>
        )}

        {activeTab === 'sms' && (
          <motion.div 
            key="sms"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-4"
          >
            {smsLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-4 text-slate-300" />
                <p className="text-sm">No SMS logs found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {smsLogs.map(log => {
                  const student = students.find(s => s.id === log.studentId);
                  return (
                    <div key={log.id} className="border-b border-slate-100 pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-slate-900">{student?.name || 'Unknown'}</span>
                          <span className="text-slate-500 text-sm ml-2">to <span className="font-mono">{log.phone}</span></span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {format(log.timestamp, 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        "{log.message}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {absentModal.isOpen && absentModal.student && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Mark {absentModal.student.name} Absent</h3>
            <p className="text-sm text-slate-500 mb-4">An SMS notification will be sent to their parent at <span className="font-mono text-slate-700">{absentModal.student.parentPhone}</span>.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Absence (Optional)</label>
              <textarea
                className="w-full p-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-slate-200 outline-none transition-all resize-none text-base border-none"
                rows={3}
                placeholder="e.g., Medical leave, Unexcused..."
                value={absentModal.reason}
                onChange={(e) => setAbsentModal(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAbsentModal({ isOpen: false, student: null, reason: '' })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkAbsent}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors"
              >
                Mark Absent & Send SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
