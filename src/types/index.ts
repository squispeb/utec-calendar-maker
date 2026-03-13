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
  teacher: string;
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

export interface SessionBundle {
  id: string;
  type: SessionType;
  group: string;
  teacher: string;
  sessions: Session[];
}

export interface SelectedConfiguration {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  sectionId: number;
  teacher: string;
  bundles: SessionBundle[];
  sessions: Session[];
  modality: Modality;
  courseType: CourseType;
  requiredBundleTypes: SessionType[];
  isComplete: boolean;
}

export interface ScheduleConflict {
  type: 'time' | 'week' | 'location';
  selection1: SelectedConfiguration;
  selection2: SelectedConfiguration;
  firstSession: Session;
  secondSession: Session;
  message: string;
}
