import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course, ParsedSchedule, SelectedSession, ScheduleConflict } from '../types';

interface ScheduleState {
  // Data
  parsedSchedule: ParsedSchedule | null;
  selectedSessions: SelectedSession[];
  conflicts: ScheduleConflict[];
  
  // Actions
  setParsedSchedule: (schedule: ParsedSchedule | null) => void;
  addSelectedSession: (session: SelectedSession) => void;
  removeSelectedSession: (courseId: string, sessionId: string) => void;
  clearSelectedSessions: () => void;
  setConflicts: (conflicts: ScheduleConflict[]) => void;
  
  // Getters
  getCourses: () => Course[];
  getSelectedCourseIds: () => string[];
  hasConflict: (session: SelectedSession) => boolean;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      // Initial state
      parsedSchedule: null,
      selectedSessions: [],
      conflicts: [],
      
      // Actions
      setParsedSchedule: (schedule) => set({ 
        parsedSchedule: schedule,
        selectedSessions: [],
        conflicts: []
      }),
      
      addSelectedSession: (session) => {
        const { selectedSessions } = get();
        // Remove any existing session for this course
        const filtered = selectedSessions.filter(
          (s) => s.courseId !== session.courseId
        );
        set({ selectedSessions: [...filtered, session] });
      },
      
      removeSelectedSession: (courseId, sessionId) => {
        const { selectedSessions } = get();
        set({
          selectedSessions: selectedSessions.filter(
            (s) => !(s.courseId === courseId && s.session.id === sessionId)
          )
        });
      },
      
      clearSelectedSessions: () => set({ selectedSessions: [], conflicts: [] }),
      
      setConflicts: (conflicts) => set({ conflicts }),
      
      // Getters
      getCourses: () => get().parsedSchedule?.courses || [],
      
      getSelectedCourseIds: () => {
        return [...new Set(get().selectedSessions.map((s) => s.courseId))];
      },
      
      hasConflict: (session) => {
        return get().conflicts.some(
          (c) => 
            c.session1.session.id === session.session.id || 
            c.session2.session.id === session.session.id
        );
      }
    }),
    {
      name: 'utec-schedule-storage',
      partialize: (state) => ({
        parsedSchedule: state.parsedSchedule ? {
          ...state.parsedSchedule,
          rawText: '' // Don't persist raw text to avoid storage issues
        } : null,
        selectedSessions: state.selectedSessions
      })
    }
  )
);
