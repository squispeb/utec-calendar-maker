import type { Schedule, Frequency, SelectedSession, ScheduleConflict, DayOfWeek } from '../types';

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 */
export function doTimeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  return s1 < e2 && s2 < e1;
}

/**
 * Check if two frequencies conflict
 * Semana General conflicts with both A and B
 * Semana A only conflicts with A
 * Semana B only conflicts with B
 */
export function doFrequenciesConflict(freq1: Frequency, freq2: Frequency): boolean {
  if (freq1 === 'Semana General' || freq2 === 'Semana General') {
    return true;
  }
  return freq1 === freq2;
}

/**
 * Check if two schedules conflict
 */
export function doSchedulesConflict(schedule1: Schedule, schedule2: Schedule): boolean {
  // Different days = no conflict
  if (schedule1.day !== schedule2.day) {
    return false;
  }
  
  // Check frequency overlap
  if (!doFrequenciesConflict(schedule1.frequency, schedule2.frequency)) {
    return false;
  }
  
  // Check time overlap
  return doTimeRangesOverlap(
    schedule1.startTime,
    schedule1.endTime,
    schedule2.startTime,
    schedule2.endTime
  );
}

/**
 * Detect conflicts between a new session and existing selected sessions
 */
export function detectConflicts(
  newSession: SelectedSession,
  existingSessions: SelectedSession[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  
  for (const existing of existingSessions) {
    // Skip if same course (can't have two sections of same course)
    if (existing.courseId === newSession.courseId) {
      continue;
    }
    
    // Check each session combination
    if (doSchedulesConflict(newSession.session.schedule, existing.session.schedule)) {
      conflicts.push({
        type: 'time',
        session1: newSession,
        session2: existing,
        message: `Horario conflicto: ${newSession.courseCode} (${newSession.session.schedule.day} ${newSession.session.schedule.startTime}-${newSession.session.schedule.endTime}) vs ${existing.courseCode} (${existing.session.schedule.day} ${existing.session.schedule.startTime}-${existing.session.schedule.endTime})`
      });
    }
  }
  
  return conflicts;
}

/**
 * Detect all conflicts in a list of selected sessions
 */
export function detectAllConflicts(sessions: SelectedSession[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const checked = new Set<string>();
  
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const session1 = sessions[i];
      const session2 = sessions[j];
      
      // Skip if same course
      if (session1.courseId === session2.courseId) {
        continue;
      }
      
      const pairKey = [session1.session.id, session2.session.id].sort().join('-');
      if (checked.has(pairKey)) {
        continue;
      }
      checked.add(pairKey);
      
      if (doSchedulesConflict(session1.session.schedule, session2.session.schedule)) {
        conflicts.push({
          type: 'time',
          session1,
          session2,
          message: `Conflicto de horario: ${session1.courseCode} vs ${session2.courseCode} (${session1.session.schedule.day} ${session1.session.schedule.startTime}-${session1.session.schedule.endTime})`
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Format day name for display
 */
export function formatDay(day: DayOfWeek): string {
  const dayNames: Record<DayOfWeek, string> = {
    'Lun': 'Lunes',
    'Mar': 'Martes',
    'Mie': 'Miércoles',
    'Jue': 'Jueves',
    'Vie': 'Viernes',
    'Sab': 'Sábado',
    'Dom': 'Domingo'
  };
  return dayNames[day] || day;
}

/**
 * Format schedule for display
 */
export function formatSchedule(schedule: Schedule): string {
  const day = formatDay(schedule.day);
  return `${day} ${schedule.startTime}-${schedule.endTime} (${schedule.frequency})`;
}
