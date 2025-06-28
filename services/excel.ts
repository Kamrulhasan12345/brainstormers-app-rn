import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import { ExcelImportData, Lecture, Exam, Student } from '@/types/admin';

class ExcelService {
  async pickExcelFile(): Promise<string | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error picking Excel file:', error);
      throw new Error('Failed to pick Excel file');
    }
  }

  async parseExcelFile(uri: string): Promise<ExcelImportData> {
    try {
      let data: ArrayBuffer;

      if (Platform.OS === 'web') {
        // For web, we need to handle file reading differently
        const response = await fetch(uri);
        data = await response.arrayBuffer();
      } else {
        // For mobile, read the file from the URI
        const response = await fetch(uri);
        data = await response.arrayBuffer();
      }

      const workbook = XLSX.read(data, { type: 'array' });
      const result: ExcelImportData = {};

      // Parse Lectures sheet
      if (workbook.SheetNames.includes('Lectures')) {
        const lecturesSheet = workbook.Sheets['Lectures'];
        const lecturesData = XLSX.utils.sheet_to_json(lecturesSheet);
        result.lectures = this.parseLecturesData(lecturesData);
      }

      // Parse Exams sheet
      if (workbook.SheetNames.includes('Exams')) {
        const examsSheet = workbook.Sheets['Exams'];
        const examsData = XLSX.utils.sheet_to_json(examsSheet);
        result.exams = this.parseExamsData(examsData);
      }

      // Parse Students sheet
      if (workbook.SheetNames.includes('Students')) {
        const studentsSheet = workbook.Sheets['Students'];
        const studentsData = XLSX.utils.sheet_to_json(studentsSheet);
        result.students = this.parseStudentsData(studentsData);
      }

      return result;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error('Failed to parse Excel file. Please check the format.');
    }
  }

  private parseLecturesData(data: any[]): Partial<Lecture>[] {
    return data.map((row, index) => ({
      id: `lecture_${Date.now()}_${index}`,
      subject: row['Subject'] || row['subject'] || '',
      topic: row['Topic'] || row['topic'] || '',
      teacher: row['Teacher'] || row['teacher'] || '',
      teacherId: row['Teacher ID'] || row['teacherId'] || `teacher_${index}`,
      date: this.parseDate(row['Date'] || row['date']),
      time: row['Time'] || row['time'] || '',
      duration: parseInt(row['Duration'] || row['duration']) || 90,
      location: row['Location'] || row['location'] || '',
      description: row['Description'] || row['description'] || '',
      materials: this.parseArray(row['Materials'] || row['materials']),
      status: 'scheduled' as const,
      attendees: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  private parseExamsData(data: any[]): Partial<Exam>[] {
    return data.map((row, index) => ({
      id: `exam_${Date.now()}_${index}`,
      subject: row['Subject'] || row['subject'] || '',
      topic: row['Topic'] || row['topic'] || '',
      date: this.parseDate(row['Date'] || row['date']),
      time: row['Time'] || row['time'] || '',
      duration: parseInt(row['Duration'] || row['duration']) || 120,
      totalMarks: parseInt(row['Total Marks'] || row['totalMarks']) || 100,
      location: row['Location'] || row['location'] || '',
      type: (row['Type'] || row['type'] || 'Unit Test') as any,
      syllabus: this.parseArray(row['Syllabus'] || row['syllabus']),
      status: 'upcoming' as const,
      students: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  private parseStudentsData(data: any[]): Partial<Student>[] {
    return data.map((row, index) => ({
      id: `student_${Date.now()}_${index}`,
      email: row['Email'] || row['email'] || '',
      name: row['Name'] || row['name'] || '',
      role: 'student' as const,
      rollNumber: row['Roll Number'] || row['rollNumber'] || '',
      class: row['Class'] || row['class'] || '',
      phone: row['Phone'] || row['phone'] || '',
      guardianPhone: row['Guardian Phone'] || row['guardianPhone'] || '',
      guardianEmail: row['Guardian Email'] || row['guardianEmail'] || '',
      attendance: [],
      examResults: [],
      guardianNotifications: true,
      createdAt: new Date().toISOString(),
    }));
  }

  private parseDate(dateValue: any): string {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    
    if (typeof dateValue === 'number') {
      // Excel date serial number
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return new Date().toISOString().split('T')[0];
  }

  private parseArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
  }

  generateSampleExcel(): void {
    // Create sample data
    const lecturesData = [
      {
        Subject: 'Physics',
        Topic: 'Electromagnetic Induction',
        Teacher: 'Dr. Rajesh Kumar',
        'Teacher ID': 'teacher_001',
        Date: '2025-01-22',
        Time: '10:00 AM - 11:30 AM',
        Duration: 90,
        Location: 'Room A-101',
        Description: 'Understanding Faraday\'s law and applications',
        Materials: 'Textbook Chapter 12, Lab Manual'
      },
      {
        Subject: 'Chemistry',
        Topic: 'Organic Compounds',
        Teacher: 'Prof. Meera Patel',
        'Teacher ID': 'teacher_002',
        Date: '2025-01-23',
        Time: '2:00 PM - 3:30 PM',
        Duration: 90,
        Location: 'Room B-205',
        Description: 'Classification and properties of organic compounds',
        Materials: 'Reference Book, Practice Problems'
      }
    ];

    const examsData = [
      {
        Subject: 'Physics',
        Topic: 'Electromagnetic Waves',
        Date: '2025-01-25',
        Time: '10:00 AM - 12:00 PM',
        Duration: 120,
        'Total Marks': 100,
        Location: 'Hall A',
        Type: 'Unit Test',
        Syllabus: 'Wave equation, EM spectrum, Properties'
      }
    ];

    const studentsData = [
      {
        Name: 'Arjun Sharma',
        Email: 'arjun.sharma@brainstormers.edu',
        'Roll Number': 'BS2027001',
        Class: 'HSC Science - Batch 2027',
        Phone: '+91 98765 43210',
        'Guardian Phone': '+91 98765 43211',
        'Guardian Email': 'parent.arjun@gmail.com'
      }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add worksheets
    const lecturesWS = XLSX.utils.json_to_sheet(lecturesData);
    const examsWS = XLSX.utils.json_to_sheet(examsData);
    const studentsWS = XLSX.utils.json_to_sheet(studentsData);
    
    XLSX.utils.book_append_sheet(wb, lecturesWS, 'Lectures');
    XLSX.utils.book_append_sheet(wb, examsWS, 'Exams');
    XLSX.utils.book_append_sheet(wb, studentsWS, 'Students');

    // For web, trigger download
    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, 'BrainStormers_Sample_Data.xlsx');
    }
  }
}

export const excelService = new ExcelService();