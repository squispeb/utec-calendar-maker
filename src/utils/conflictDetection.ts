import type {
  DayOfWeek,
  Frequency,
  Schedule,
  ScheduleConflict,
  SelectedConfiguration,
  Session,
} from '../types'

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function doTimeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)

  return s1 < e2 && s2 < e1
}

export function doFrequenciesConflict(freq1: Frequency, freq2: Frequency): boolean {
  if (freq1 === 'Semana General' || freq2 === 'Semana General') {
    return true
  }

  return freq1 === freq2
}

export function doSchedulesConflict(schedule1: Schedule, schedule2: Schedule): boolean {
  if (schedule1.day !== schedule2.day) {
    return false
  }

  if (!doFrequenciesConflict(schedule1.frequency, schedule2.frequency)) {
    return false
  }

  return doTimeRangesOverlap(
    schedule1.startTime,
    schedule1.endTime,
    schedule2.startTime,
    schedule2.endTime,
  )
}

export function detectAllConflicts(selections: SelectedConfiguration[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const checked = new Set<string>()

  for (let i = 0; i < selections.length; i += 1) {
    for (let j = i + 1; j < selections.length; j += 1) {
      const selection1 = selections[i]
      const selection2 = selections[j]

      if (selection1.courseId === selection2.courseId) {
        continue
      }

      for (const firstSession of selection1.sessions) {
        for (const secondSession of selection2.sessions) {
          const pairKey = [firstSession.id, secondSession.id].sort().join('--')
          if (checked.has(pairKey)) {
            continue
          }
          checked.add(pairKey)

          if (!doSchedulesConflict(firstSession.schedule, secondSession.schedule)) {
            continue
          }

          conflicts.push({
            type: 'time',
            selection1,
            selection2,
            firstSession,
            secondSession,
            message:
              `${selection1.courseCode} conflicts with ${selection2.courseCode} on ` +
              `${formatDay(firstSession.schedule.day)} ` +
              `${firstSession.schedule.startTime}-${firstSession.schedule.endTime}`,
          })
        }
      }
    }
  }

  return conflicts
}

export function formatDay(day: DayOfWeek): string {
  const dayNames: Record<DayOfWeek, string> = {
    Lun: 'Lunes',
    Mar: 'Martes',
    Mie: 'Miercoles',
    Jue: 'Jueves',
    Vie: 'Viernes',
    Sab: 'Sabado',
    Dom: 'Domingo',
  }

  return dayNames[day] || day
}

export function formatSchedule(schedule: Schedule): string {
  return `${formatDay(schedule.day)} ${schedule.startTime}-${schedule.endTime} (${schedule.frequency})`
}

export function describeSession(session: Session): string {
  return `${session.type} ${session.group} · ${formatSchedule(session.schedule)}`
}
