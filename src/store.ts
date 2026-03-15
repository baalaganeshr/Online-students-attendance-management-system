import { format } from "date-fns";

export interface Student {
  id: string;
  name: string;
  parentPhone: string;
  department: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  status: 'Present' | 'Absent';
  distanceMeters: number;
  lat: number;
  lng: number;
  photoUrl?: string;
  reason?: string;
}

export interface SmsLog {
  id: string;
  studentId: string;
  phone: string;
  message: string;
  timestamp: number;
}

const INITIAL_STUDENTS: Student[] = [
  { id: "S101", name: "Priya Sharma", parentPhone: "+91 98765 43210", department: "B.Sc Computer Science" },
  { id: "S102", name: "Ananya Patel", parentPhone: "+91 87654 32109", department: "B.Com" },
  { id: "S103", name: "Kavya Iyer", parentPhone: "+91 76543 21098", department: "B.A English" },
  { id: "S104", name: "Meera Reddy", parentPhone: "+91 65432 10987", department: "BBA" },
];

export const store = {
  getStudents: (): Student[] => {
    const data = localStorage.getItem('geoattend_students');
    if (!data) {
      localStorage.setItem('geoattend_students', JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(data);
  },

  getAttendance: (date: string): AttendanceRecord[] => {
    const data = localStorage.getItem(`geoattend_records_${date}`);
    return data ? JSON.parse(data) : [];
  },

  markAttendance: (record: Omit<AttendanceRecord, 'id'>) => {
    const records = store.getAttendance(record.date);
    const newRecord = { ...record, id: Math.random().toString(36).substr(2, 9) };
    
    // Remove existing record for the same student on the same day if re-marking
    const filtered = records.filter(r => r.studentId !== record.studentId);
    filtered.push(newRecord);
    
    localStorage.setItem(`geoattend_records_${record.date}`, JSON.stringify(filtered));
    return newRecord;
  },

  getSmsLogs: (): SmsLog[] => {
    const data = localStorage.getItem('geoattend_sms_logs');
    return data ? JSON.parse(data) : [];
  },

  logSms: (log: Omit<SmsLog, 'id'>) => {
    const logs = store.getSmsLogs();
    const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    logs.unshift(newLog); // Add to beginning
    localStorage.setItem('geoattend_sms_logs', JSON.stringify(logs));
    return newLog;
  }
};
