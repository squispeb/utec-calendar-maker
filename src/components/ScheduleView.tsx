import { useMemo } from 'react';
import { useScheduleStore } from '../store/scheduleStore';
import { detectAllConflicts, formatDay, timeToMinutes } from '../utils/conflictDetection';
import type { DayOfWeek, SelectedSession } from '../types';
import { AlertCircle, X } from 'lucide-react';

const DAYS: DayOfWeek[] = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 60; // pixels per hour

export function ScheduleView() {
  const selectedSessions = useScheduleStore((state) => state.selectedSessions);
  const conflicts = useScheduleStore((state) => state.conflicts);
  const setConflicts = useScheduleStore((state) => state.setConflicts);
  const removeSelectedSession = useScheduleStore((state) => state.removeSelectedSession);

  // Recalculate conflicts when sessions change
  const allConflicts = useMemo(() => {
    const newConflicts = detectAllConflicts(selectedSessions);
    if (JSON.stringify(newConflicts) !== JSON.stringify(conflicts)) {
      setConflicts(newConflicts);
    }
    return newConflicts;
  }, [selectedSessions, conflicts, setConflicts]);

  const sessionsByDay = useMemo(() => {
    const byDay: Record<DayOfWeek, SelectedSession[]> = {
      Lun: [], Mar: [], Mie: [], Jue: [], Vie: [], Sab: [], Dom: []
    };
    
    selectedSessions.forEach((session) => {
      byDay[session.session.schedule.day].push(session);
    });
    
    return byDay;
  }, [selectedSessions]);

  const getSessionStyle = (session: SelectedSession) => {
    const startMinutes = timeToMinutes(session.session.schedule.startTime);
    const endMinutes = timeToMinutes(session.session.schedule.endTime);
    const duration = endMinutes - startMinutes;
    const top = (startMinutes - START_HOUR * 60) * (HOUR_HEIGHT / 60);
    const height = duration * (HOUR_HEIGHT / 60);
    
    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const isSessionInConflict = (session: SelectedSession) => {
    return allConflicts.some(
      (c) => 
        c.session1.session.id === session.session.id || 
        c.session2.session.id === session.session.id
    );
  };

  if (selectedSessions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-500">No sessions selected</p>
        <p className="text-sm text-gray-400 mt-2">
          Select courses from the browser to see your schedule
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Conflicts Alert */}
      {allConflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-medium text-red-900">
              Schedule Conflicts Detected ({allConflicts.length})
            </h3>
          </div>
          <ul className="space-y-1 text-sm text-red-700">
            {allConflicts.map((conflict) => (
              <li key={`conflict-${conflict.session1.session.id}-${conflict.session2.session.id}`}>{conflict.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Time column header */}
          <div className="bg-gray-50 p-3 text-sm font-medium text-gray-700">
            Time
          </div>
          
          {/* Day headers */}
          {DAYS.map((day) => (
            <div key={day} className="bg-gray-50 p-3 text-sm font-medium text-gray-700 text-center">
              {formatDay(day)}
            </div>
          ))}
          
          {/* Time slots */}
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((hour) => (
            <>
              {/* Time label */}
              <div 
                key={`time-${hour}`} 
                className="bg-white p-2 text-xs text-gray-500 text-right border-t border-gray-100"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hour}:00
              </div>
              
              {/* Day columns */}
              {DAYS.map((day) => (
                <div 
                  key={`${day}-${hour}`}
                  className="bg-white border-t border-gray-100 relative"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {/* Render sessions for this day that start at this hour or earlier and span into this hour */}
                  {sessionsByDay[day]
                    .filter((session) => {
                      const startHour = parseInt(session.session.schedule.startTime.split(':')[0]);
                      return startHour === hour || (startHour < hour && parseInt(session.session.schedule.endTime.split(':')[0]) > hour);
                    })
                    .map((session) => {
                      const startHour = parseInt(session.session.schedule.startTime.split(':')[0]);
                      if (startHour !== hour) return null; // Only render at start hour
                      
                      const inConflict = isSessionInConflict(session);
                      
                      return (
                        <div
                          key={session.session.id}
                          className={`
                            absolute inset-x-1 rounded p-2 text-xs overflow-hidden
                            ${inConflict 
                              ? 'bg-red-100 border border-red-300' 
                              : 'bg-blue-100 border border-blue-200'
                            }
                          `}
                          style={getSessionStyle(session)}
                        >
                          <button
                            type="button"
                            onClick={() => removeSelectedSession(session.courseId, session.session.id)}
                            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="font-medium truncate pr-4">{session.courseCode}</div>
                          <div className="truncate">{session.session.type}</div>
                          <div className="text-gray-600">
                            {session.session.schedule.startTime}-{session.session.schedule.endTime}
                          </div>
                          {inConflict && (
                            <div className="text-red-600 font-medium mt-1">⚠ Conflict</div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Selected Courses</h3>
        <div className="space-y-2">
          {selectedSessions.map((session) => {
            const inConflict = isSessionInConflict(session);
            return (
              <div 
                key={session.session.id}
                className={`
                  flex items-center justify-between p-2 rounded
                  ${inConflict ? 'bg-red-50' : 'bg-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{session.courseCode}</span>
                  <span className="text-gray-600">{session.courseName}</span>
                  <span className="text-sm text-gray-500">
                    Section {session.sectionId} - {session.teacher}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {formatDay(session.session.schedule.day)} {session.session.schedule.startTime}-{session.session.schedule.endTime}
                  </span>
                  {inConflict && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeSelectedSession(session.courseId, session.session.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
