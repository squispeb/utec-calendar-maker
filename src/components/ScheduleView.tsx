import { useMemo } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useScheduleStore } from '../store/scheduleStore'
import { formatDay, timeToMinutes } from '../utils/conflictDetection'
import type { DayOfWeek, SelectedConfiguration, Session } from '../types'

const DAYS: DayOfWeek[] = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const START_HOUR = 7
const END_HOUR = 22
const HOUR_HEIGHT = 60
const DAY_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT

const COURSE_COLOR_PALETTE = [
  {
    card: 'border-sky-300 bg-sky-100 text-sky-950',
    summary: 'border-l-sky-500',
  },
  {
    card: 'border-emerald-300 bg-emerald-100 text-emerald-950',
    summary: 'border-l-emerald-500',
  },
  {
    card: 'border-amber-300 bg-amber-100 text-amber-950',
    summary: 'border-l-amber-500',
  },
  {
    card: 'border-fuchsia-300 bg-fuchsia-100 text-fuchsia-950',
    summary: 'border-l-fuchsia-500',
  },
  {
    card: 'border-violet-300 bg-violet-100 text-violet-950',
    summary: 'border-l-violet-500',
  },
  {
    card: 'border-rose-300 bg-rose-100 text-rose-950',
    summary: 'border-l-rose-500',
  },
  {
    card: 'border-cyan-300 bg-cyan-100 text-cyan-950',
    summary: 'border-l-cyan-500',
  },
  {
    card: 'border-lime-300 bg-lime-100 text-lime-950',
    summary: 'border-l-lime-500',
  },
  {
    card: 'border-orange-300 bg-orange-100 text-orange-950',
    summary: 'border-l-orange-500',
  },
  {
    card: 'border-teal-300 bg-teal-100 text-teal-950',
    summary: 'border-l-teal-500',
  },
  {
    card: 'border-indigo-300 bg-indigo-100 text-indigo-950',
    summary: 'border-l-indigo-500',
  },
  {
    card: 'border-pink-300 bg-pink-100 text-pink-950',
    summary: 'border-l-pink-500',
  },
]

type ScheduledMeeting = {
  configuration: SelectedConfiguration
  session: Session
}

function buildCourseColorMap(selectedConfigurations: SelectedConfiguration[]) {
  const assignments = new Map<string, (typeof COURSE_COLOR_PALETTE)[number]>()

  const ordered = [...selectedConfigurations].sort((a, b) =>
    a.courseCode.localeCompare(b.courseCode, undefined, { numeric: true }),
  )

  ordered.forEach((configuration, index) => {
    assignments.set(
      configuration.courseId,
      COURSE_COLOR_PALETTE[index % COURSE_COLOR_PALETTE.length],
    )
  })

  return assignments
}

export function ScheduleView() {
  const selectedConfigurations = useScheduleStore((state) => state.selectedConfigurations)
  const conflicts = useScheduleStore((state) => state.conflicts)
  const removeSelectedCourse = useScheduleStore((state) => state.removeSelectedCourse)

  const meetings = useMemo<ScheduledMeeting[]>(() => {
    return selectedConfigurations.flatMap((configuration) =>
      configuration.sessions.map((session) => ({ configuration, session })),
    )
  }, [selectedConfigurations])

  const courseColorMap = useMemo(
    () => buildCourseColorMap(selectedConfigurations),
    [selectedConfigurations],
  )

  const meetingsByDay = useMemo(() => {
    const byDay: Record<DayOfWeek, ScheduledMeeting[]> = {
      Lun: [],
      Mar: [],
      Mie: [],
      Jue: [],
      Vie: [],
      Sab: [],
      Dom: [],
    }

    for (const meeting of meetings) {
      byDay[meeting.session.schedule.day].push(meeting)
    }

    return byDay
  }, [meetings])

  const isMeetingInConflict = (meeting: ScheduledMeeting) => {
    return conflicts.some(
      (conflict) =>
        conflict.firstSession.id === meeting.session.id ||
        conflict.secondSession.id === meeting.session.id,
    )
  }

  const getMeetingStyle = (session: Session) => {
    const startMinutes = timeToMinutes(session.schedule.startTime)
    const endMinutes = timeToMinutes(session.schedule.endTime)
    const duration = endMinutes - startMinutes
    const top = (startMinutes - START_HOUR * 60) * (HOUR_HEIGHT / 60)
    const height = duration * (HOUR_HEIGHT / 60)

    return {
      top: `${top}px`,
      height: `${height}px`,
    }
  }

  if (selectedConfigurations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No configurations selected</p>
        <p className="mt-2 text-sm text-gray-400">
          Pick a course configuration from the left panel to build your schedule
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-medium text-red-900">
              Schedule conflicts detected ({conflicts.length})
            </h3>
          </div>
          <ul className="space-y-1 text-sm text-red-700">
            {conflicts.map((conflict) => (
              <li
                key={`conflict-${conflict.firstSession.id}-${conflict.secondSession.id}`}
              >
                {conflict.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <div className="grid min-w-[900px] grid-cols-[80px_repeat(6,minmax(140px,1fr))]">
          <div className="border-b border-r border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700">
            Time
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="border-b border-r border-gray-200 bg-gray-50 p-3 text-center text-sm font-medium text-gray-700 last:border-r-0"
            >
              {formatDay(day)}
            </div>
          ))}

          <div className="relative border-r border-gray-200 bg-white last:border-r-0" style={{ height: `${DAY_HEIGHT}px` }}>
            {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index).map((hour) => {
              const top = (hour - START_HOUR) * HOUR_HEIGHT

              return (
                <div
                  key={`time-${hour}`}
                  className="absolute left-0 right-0 border-t border-gray-100 pr-3 text-right text-xs text-gray-500"
                  style={{ top: `${top}px`, transform: 'translateY(-50%)' }}
                >
                  {hour}:00
                </div>
              )
            })}
          </div>

          {DAYS.map((day) => (
            <DayColumn
              key={day}
              day={day}
              meetings={meetingsByDay[day]}
              courseColorMap={courseColorMap}
              isMeetingInConflict={isMeetingInConflict}
              getMeetingStyle={getMeetingStyle}
              onRemoveCourse={removeSelectedCourse}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-medium text-gray-900">Selected course configurations</h3>
        <div className="space-y-2">
          {selectedConfigurations.map((configuration) => {
            const hasConflict = conflicts.some(
              (conflict) =>
                conflict.selection1.id === configuration.id ||
                conflict.selection2.id === configuration.id,
            )

            return (
              <div
                key={configuration.id}
                className={`rounded border-l-4 p-3 ${courseColorMap.get(configuration.courseId)?.summary ?? COURSE_COLOR_PALETTE[0].summary} ${hasConflict ? 'bg-red-50' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {configuration.courseCode} · {configuration.courseName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Section {configuration.sectionId} · {configuration.teacher}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {configuration.sessions.map((session) => (
                        <div key={session.id}>
                          {formatDay(session.schedule.day)} {session.schedule.startTime}-{session.schedule.endTime} · {session.type} {session.group}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasConflict && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <button
                      type="button"
                      onClick={() => removeSelectedCourse(configuration.courseId)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface DayColumnProps {
  day: DayOfWeek
  meetings: ScheduledMeeting[]
  courseColorMap: Map<string, (typeof COURSE_COLOR_PALETTE)[number]>
  isMeetingInConflict: (meeting: ScheduledMeeting) => boolean
  getMeetingStyle: (session: Session) => { top: string; height: string }
  onRemoveCourse: (courseId: string) => void
}

function DayColumn({
  day,
  meetings,
  courseColorMap,
  isMeetingInConflict,
  getMeetingStyle,
  onRemoveCourse,
}: DayColumnProps) {
  return (
    <div className="relative border-r border-gray-200 bg-white last:border-r-0" style={{ height: `${DAY_HEIGHT}px` }}>
      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index).map((hour) => {
        const top = (hour - START_HOUR) * HOUR_HEIGHT

        return (
          <div
            key={`${day}-${hour}`}
            className="pointer-events-none absolute left-0 right-0 border-t border-gray-100"
            style={{ top: `${top}px` }}
          />
        )
      })}

      {meetings.map((meeting) => {
        const inConflict = isMeetingInConflict(meeting)
        const color = courseColorMap.get(meeting.configuration.courseId) ?? COURSE_COLOR_PALETTE[0]

        return (
          <div
            key={meeting.session.id}
            className={`absolute inset-x-1 rounded border p-2 text-xs shadow-sm ${color.card} ${
              inConflict
                ? 'ring-2 ring-red-400 ring-offset-1'
                : ''
            }`}
            style={getMeetingStyle(meeting.session)}
          >
            <button
              type="button"
              onClick={() => onRemoveCourse(meeting.configuration.courseId)}
              className="absolute right-1 top-1 text-gray-500 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="truncate pr-4 font-medium">{meeting.configuration.courseCode}</div>
            <div className="truncate pr-4 text-[11px] opacity-80">{meeting.configuration.teacher}</div>
            <div className="truncate">{meeting.session.type} {meeting.session.group}</div>
            <div className="opacity-80">
              {meeting.session.schedule.startTime}-{meeting.session.schedule.endTime}
            </div>
          </div>
        )
      })}
    </div>
  )
}
