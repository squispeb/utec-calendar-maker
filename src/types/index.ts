export type DayOfWeek = 'Lun' | 'Mar' | 'Mie' | 'Jue' | 'Vie' | 'Sab' | 'Dom';

export type SessionType = 'Teoría' | 'Laboratorio' | 'Virtual';

export type Modality = 'Presencial' | 'Sincronico' | 'Virtual';

export type CourseType = 'Obligatorio' | 'Electivo';

export type Frequency = 'Semana General' | 'Semana A' | 'Semana B';

export interface Schedule {
  day: DayOfWeek;
  startTime: string; // "HH:MM" format
  endTime: string;   // "HH:MM" format
  frequency: Frequency;
}

export interface Session {
  id: string;
  type: SessionType;
  group: string;
  schedule: Schedule;
  location: string;
  vacancies: number;
  enrolled: number;
}

export interface Section {
  id: number;
  teacher: string;
  sessions: Session[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  type: CourseType;
  modality: Modality;
  sections: Section[];
}

export interface StudentInfo {
  name: string;
  program: string;
  career: string;
  curriculum: string;
  period: string;
  enrollmentDate: string;
}

export interface ParsedSchedule {
  studentInfo: StudentInfo;
  courses: Course[];
  rawText: string;
}

export interface SelectedSession {
  courseId: string;
  courseCode: string;
  courseName: string;
  sectionId: number;
  teacher: string;
  session: Session;
}

export interface ScheduleConflict {
  type: 'time' | 'week' | 'location';
  session1: SelectedSession;
  session2: SelectedSession;
  message: string;
}
