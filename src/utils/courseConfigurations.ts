import type {
  Course,
  Section,
  SelectedConfiguration,
  Session,
  SessionBundle,
  SessionType,
} from '../types'

const TYPE_ORDER: Record<string, number> = {
  'Teoría': 0,
  'Laboratorio': 1,
  'Virtual': 2,
}

function compareSessions(a: Session, b: Session) {
  const dayOrder = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
  const dayDiff = dayOrder.indexOf(a.schedule.day) - dayOrder.indexOf(b.schedule.day)

  if (dayDiff !== 0) {
    return dayDiff
  }

  return a.schedule.startTime.localeCompare(b.schedule.startTime)
}

export function deriveTeacherName(sessions: Session[]): string {
  const teachers = [...new Set(sessions.map((session) => session.teacher).filter(Boolean))]

  if (teachers.length === 0) {
    return 'Unknown'
  }

  if (teachers.length === 1) {
    return teachers[0]
  }

  return teachers.join(', ')
}

export function getSectionBundles(section: Section): SessionBundle[] {
  const bundles = new Map<string, SessionBundle>()

  for (const session of section.sessions) {
    const key = `${session.type}:${session.group}`
    const existing = bundles.get(key)

    if (existing) {
      existing.sessions.push(session)
      existing.sessions.sort(compareSessions)
      continue
    }

    bundles.set(key, {
      id: key,
      type: session.type,
      group: session.group,
      teacher: session.teacher,
      sessions: [session],
    })
  }

  return Array.from(bundles.values())
    .map((bundle) => ({
      ...bundle,
      teacher: deriveTeacherName(bundle.sessions),
    }))
    .sort((a, b) => {
    const typeDiff = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99)
    if (typeDiff !== 0) {
      return typeDiff
    }

    return a.group.localeCompare(b.group, undefined, { numeric: true })
  })
}

function cartesian<T>(items: T[][]): T[][] {
  if (items.length === 0) {
    return []
  }

  return items.reduce<T[][]>(
    (acc, group) => acc.flatMap((prefix) => group.map((item) => [...prefix, item])),
    [[]],
  )
}

export function getRequiredBundleTypes(section: Section): SessionType[] {
  return [...new Set(getSectionBundles(section).map((bundle) => bundle.type))]
}

export function buildSelectedConfiguration(
  course: Course,
  section: Section,
  bundles: SessionBundle[],
): SelectedConfiguration {
  const requiredBundleTypes = getRequiredBundleTypes(section)
  const sessions = bundles.flatMap((bundle) => bundle.sessions).sort(compareSessions)
  const selectedTypes = new Set(bundles.map((bundle) => bundle.type))
  const teacher = deriveTeacherName(sessions)

  return {
    id: `${course.id}-S${section.id}-${bundles.map((bundle) => bundle.id).sort().join('__') || 'empty'}`,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    sectionId: section.id,
    teacher,
    bundles: [...bundles].sort((a, b) => {
      const typeDiff = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99)
      if (typeDiff !== 0) {
        return typeDiff
      }

      return a.group.localeCompare(b.group, undefined, { numeric: true })
    }),
    sessions,
    modality: course.modality,
    courseType: course.type,
    requiredBundleTypes,
    isComplete: requiredBundleTypes.every((type) => selectedTypes.has(type)),
  }
}

export function buildCourseConfigurations(course: Course): SelectedConfiguration[] {
  return course.sections.flatMap((section) => {
    const bundles = getSectionBundles(section)
    const bundlesByType = new Map<string, SessionBundle[]>()

    for (const bundle of bundles) {
      const existing = bundlesByType.get(bundle.type) ?? []
      existing.push(bundle)
      bundlesByType.set(bundle.type, existing)
    }

    const configurationParts = Array.from(bundlesByType.values())
    const combinations = cartesian(configurationParts)

    return combinations.map((combination) => buildSelectedConfiguration(course, section, combination))
  })
}
