import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useScheduleStore } from '../store/scheduleStore';
import { detectConflicts, formatSchedule } from '../utils/conflictDetection';
import type { Course, Section, Session, CourseType, Modality } from '../types';
import { BookOpen, Users, MapPin, Clock, AlertCircle } from 'lucide-react';

const columnHelper = createColumnHelper<Course>();

export function CourseBrowser() {
  const courses = useScheduleStore((state) => state.getCourses());
  const selectedSessions = useScheduleStore((state) => state.selectedSessions);
  const addSelectedSession = useScheduleStore((state) => state.addSelectedSession);
  const setConflicts = useScheduleStore((state) => state.setConflicts);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterType, setFilterType] = useState<CourseType | 'all'>('all');
  const [filterModality, setFilterModality] = useState<Modality | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesType = filterType === 'all' || course.type === filterType;
      const matchesModality = filterModality === 'all' || course.modality === filterModality;
      const matchesSearch = 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesModality && matchesSearch;
    });
  }, [courses, filterType, filterModality, searchTerm]);

  const handleSessionSelect = (course: Course, section: Section, session: Session) => {
    const selectedSession = {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      sectionId: section.id,
      teacher: section.teacher,
      session,
    };

    // Detect conflicts with existing selections
    const conflicts = detectConflicts(selectedSession, selectedSessions);
    if (conflicts.length > 0) {
      setConflicts(conflicts);
    }

    addSelectedSession(selectedSession);
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">No courses loaded. Please upload a schedule PDF.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="search-filter"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Course name or code..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CourseType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Obligatorio">Obligatorio</option>
              <option value="Electivo">Electivo</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="modality-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Modality
            </label>
            <select
              id="modality-filter"
              value={filterModality}
              onChange={(e) => setFilterModality(e.target.value as Modality | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Modalities</option>
              <option value="Presencial">Presencial</option>
              <option value="Sincronico">Sincronico</option>
              <option value="Virtual">Virtual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onSessionSelect={handleSessionSelect}
            selectedSession={selectedSessions.find((s) => s.courseId === course.id)}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No courses match your filters
        </div>
      )}
    </div>
  );
}

interface CourseCardProps {
  course: Course;
  onSessionSelect: (course: Course, section: Section, session: Session) => void;
  selectedSession?: { sectionId: number; session: Session };
}

function CourseCard({ course, onSessionSelect, selectedSession }: CourseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-full">
      {/* Course Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${course.type === 'Obligatorio' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
            }
          `}>
            {course.type}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate" title={course.name}>{course.name}</h3>
            <p className="text-sm text-gray-500">{course.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{course.modality}</span>
          <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {/* Sections */}
      {expanded && (
        <div className="border-t border-gray-200">
          {course.sections.map((section) => (
            <div key={section.id} className="p-4 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">
                  Section {section.id} - {section.teacher}
                </span>
              </div>
              
              {/* Sessions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {section.sessions.map((session) => {
                  const isSelected = 
                    selectedSession?.sectionId === section.id && 
                    selectedSession?.session.id === session.id;
                  
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => onSessionSelect(course, section, session)}
                      className={`
                        p-3 rounded-lg border text-left transition-all
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`
                          text-xs font-medium px-2 py-1 rounded
                          ${session.type === 'Teoría' 
                            ? 'bg-purple-100 text-purple-800'
                            : session.type === 'Laboratorio'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {session.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          Group {session.group}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{formatSchedule(session.schedule)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{session.location || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Users className="h-3 w-3" />
                          <span>{session.vacancies - session.enrolled} vacancies</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
