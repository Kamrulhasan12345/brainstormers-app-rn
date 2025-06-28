export interface Lecture {
  id: string;
  subject: string;
  topic: string;
  teacher: string;
  teacherId: string;
  date: string;
  time: string;
  duration: number; // in minutes
  location: string;
  description: string;
  materials: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendees: string[]; // student IDs
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  subject: string;
  topic: string;
  date: string;
  time: string;
  duration: number; // in minutes
  totalMarks: number;
  location: string;
  type: 'Unit Test' | 'Chapter Test' | 'Monthly Test' | 'Prelims' | 'Board Exam';
  syllabus: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  students: string[]; // student IDs
  results?: ExamResult[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamResult {
  studentId: string;
  marksObtained: number;
  grade: string;
  remarks?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'exam' | 'lecture' | 'assignment' | 'general' | 'absence';
  recipients: string[]; // user IDs
  scheduledFor: string;
  sent: boolean;
  createdAt: string;
}

export interface Student extends User {
  attendance: AttendanceRecord[];
  examResults: ExamResult[];
  guardianNotifications: boolean;
}

export interface AttendanceRecord {
  lectureId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedAt: string;
}

export interface ExcelImportData {
  lectures?: Partial<Lecture>[];
  exams?: Partial<Exam>[];
  students?: Partial<Student>[];
}