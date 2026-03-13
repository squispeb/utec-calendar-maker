import { useMemo, useState } from 'react'
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Users,
} from 'lucide-react'
import { useScheduleStore } from '../store/scheduleStore'
import type { Course, CourseType, Modality, Section, SessionBundle } from '../types'
import { describeSession } from '../utils/conflictDetection'
import { getRequiredBundleTypes, getSectionBundles } from '../utils/courseConfigurations'

export function CourseBrowser() {
  const courses = useScheduleStore((state) => state.getCourses())

  const [filterType, setFilterType] = useState<CourseType | 'all'>('all')
  const [filterModality, setFilterModality] = useState<Modality | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesType = filterType === 'all' || course.type === filterType
      const matchesModality = filterModality === 'all' || course.modality === filterModality
      const query = searchTerm.trim().toLowerCase()
      const matchesSearch =
        query.length === 0 ||
        course.name.toLowerCase().includes(query) ||
        course.code.toLowerCase().includes(query)

      return matchesType && matchesModality && matchesSearch
    })
  }, [courses, filterModality, filterType, searchTerm])

  if (courses.length === 0) {
    return (
      <div className="py-12 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="text-gray-600">No courses loaded. Please upload a schedule PDF.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-hidden">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="search-filter" className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="search-filter"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Course name or code..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="type-filter" className="mb-2 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CourseType | 'all')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Obligatorio">Obligatorio</option>
              <option value="Electivo">Electivo</option>
            </select>
          </div>

          <div>
            <label htmlFor="modality-filter" className="mb-2 block text-sm font-medium text-gray-700">
              Modality
            </label>
            <select
              id="modality-filter"
              value={filterModality}
              onChange={(e) => setFilterModality(e.target.value as Modality | 'all')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Modalities</option>
              <option value="Presencial">Presencial</option>
              <option value="Sincronico">Sincronico</option>
              <option value="Virtual">Virtual</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="py-8 text-center text-gray-500">No courses match your filters</div>
      )}
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  const selectedConfiguration = useScheduleStore((state) =>
    state.selectedConfigurations.find((item) => item.courseId === course.id),
  )
  const toggleBundleSelection = useScheduleStore((state) => state.toggleBundleSelection)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              course.type === 'Obligatorio'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {course.type}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900" title={course.name}>
              {course.name}
            </h3>
            <p className="text-sm text-gray-500">{course.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          {selectedConfiguration?.bundles?.length ? (
            <span>
              {selectedConfiguration.bundles.length}/
              {selectedConfiguration.requiredBundleTypes?.length ?? selectedConfiguration.bundles.length} picked
            </span>
          ) : null}
          <span>{course.modality}</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50/50 p-4">
          <div className="space-y-4">
            {course.sections.map((section) => {
              const bundles = getSectionBundles(section)
              const requiredTypes = getRequiredBundleTypes(section)
              const isActiveSection = selectedConfiguration?.sectionId === section.id

              return (
                <SectionBuilder
                  key={`${course.id}-${section.id}`}
                  section={section}
                  bundles={bundles}
                  requiredTypes={requiredTypes}
                  activeBundleIds={isActiveSection ? selectedConfiguration?.bundles.map((bundle) => bundle.id) ?? [] : []}
                  onToggleBundle={(bundle) => toggleBundleSelection(course, section, bundle)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface SectionBuilderProps {
  section: Section
  bundles: SessionBundle[]
  requiredTypes: string[]
  activeBundleIds: string[]
  onToggleBundle: (bundle: SessionBundle) => void
}

function SectionBuilder({ section, bundles, requiredTypes, activeBundleIds, onToggleBundle }: SectionBuilderProps) {
  const selectedCount = activeBundleIds.length

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">Section {section.id}</p>
          <p className="text-sm text-gray-500">{section.teacher}</p>
        </div>
        <div className="text-xs font-medium text-gray-500">
          {selectedCount}/{requiredTypes.length} selections
        </div>
      </div>

      <div className="space-y-3">
        {requiredTypes.map((type) => {
          const typeBundles = bundles.filter((bundle) => bundle.type === type)

          return (
            <div key={`${section.id}-${type}`} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {type}
              </div>
              <div className="grid gap-2">
                {typeBundles.map((bundle) => {
                  const isSelected = activeBundleIds.includes(bundle.id)

                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => onToggleBundle(bundle)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              Group {bundle.group}
                            </span>
                            {isSelected ? <Check className="h-4 w-4 text-blue-600" /> : null}
                          </div>
                          <p className="mt-2 text-sm font-medium text-gray-700">{bundle.teacher}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {bundle.sessions.map((session) => (
                          <div key={session.id} className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{describeSession(session)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{session.location || 'Location TBA'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Users className="h-3.5 w-3.5" />
                              <span>{Math.max(session.vacancies - session.enrolled, 0)} vacancies</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
