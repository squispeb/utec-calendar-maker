import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildSelectedConfiguration } from '../utils/courseConfigurations'
import { detectAllConflicts } from '../utils/conflictDetection'
import type {
  Course,
  ParsedSchedule,
  ScheduleConflict,
  Section,
  SelectedConfiguration,
  SessionBundle,
} from '../types'

interface ScheduleState {
  parsedSchedule: ParsedSchedule | null
  selectedConfigurations: SelectedConfiguration[]
  conflicts: ScheduleConflict[]
  setParsedSchedule: (schedule: ParsedSchedule | null) => void
  toggleBundleSelection: (course: Course, section: Section, bundle: SessionBundle) => void
  removeSelectedCourse: (courseId: string) => void
  clearSelectedConfigurations: () => void
  getCourses: () => Course[]
  getSelectedCourseIds: () => string[]
}

function buildNextSelection(
  current: SelectedConfiguration | undefined,
  course: Course,
  section: Section,
  bundle: SessionBundle,
) {
  if (!current || current.sectionId !== section.id) {
    return buildSelectedConfiguration(course, section, [bundle])
  }

  const alreadySelected = current.bundles.some((item) => item.id === bundle.id)
  let nextBundles = current.bundles.filter((item) => item.type !== bundle.type)

  if (!alreadySelected) {
    nextBundles = [...nextBundles, bundle]
  }

  if (nextBundles.length === 0) {
    return null
  }

  return buildSelectedConfiguration(course, section, nextBundles)
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      parsedSchedule: null,
      selectedConfigurations: [],
      conflicts: [],

      setParsedSchedule: (schedule) =>
        set({
          parsedSchedule: schedule,
          selectedConfigurations: [],
          conflicts: [],
        }),

      toggleBundleSelection: (course, section, bundle) => {
        const current = get().selectedConfigurations.find((item) => item.courseId === course.id)
        const nextSelection = buildNextSelection(current, course, section, bundle)

        const nextConfigurations = [
          ...get().selectedConfigurations.filter((item) => item.courseId !== course.id),
          ...(nextSelection ? [nextSelection] : []),
        ]

        set({
          selectedConfigurations: nextConfigurations,
          conflicts: detectAllConflicts(nextConfigurations),
        })
      },

      removeSelectedCourse: (courseId) => {
        const nextConfigurations = get().selectedConfigurations.filter(
          (item) => item.courseId !== courseId,
        )

        set({
          selectedConfigurations: nextConfigurations,
          conflicts: detectAllConflicts(nextConfigurations),
        })
      },

      clearSelectedConfigurations: () =>
        set({ selectedConfigurations: [], conflicts: [] }),

      getCourses: () => get().parsedSchedule?.courses || [],

      getSelectedCourseIds: () =>
        [...new Set(get().selectedConfigurations.map((item) => item.courseId))],
    }),
    {
      name: 'utec-schedule-storage',
      version: 4,
      migrate: (_persistedState: unknown) => {
        return {
          parsedSchedule: null,
          selectedConfigurations: [],
          conflicts: [],
        }
      },
      partialize: (state) => ({
        parsedSchedule: state.parsedSchedule
          ? {
              ...state.parsedSchedule,
              rawText: '',
            }
          : null,
        selectedConfigurations: state.selectedConfigurations,
      }),
    },
  ),
)
