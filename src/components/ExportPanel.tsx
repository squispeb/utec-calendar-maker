import { useScheduleStore } from '../store/scheduleStore';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';

export function ExportPanel() {
  const selectedSessions = useScheduleStore((state) => state.selectedSessions);
  const studentInfo = useScheduleStore((state) => state.parsedSchedule?.studentInfo);

  const exportToJSON = () => {
    const data = {
      studentInfo,
      sessions: selectedSessions,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utec-schedule-${studentInfo?.period || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Course Code', 'Course Name', 'Section', 'Teacher', 'Type', 'Day', 'Start Time', 'End Time', 'Frequency', 'Location'];
    
    const rows = selectedSessions.map((session) => [
      session.courseCode,
      session.courseName,
      session.sectionId.toString(),
      session.teacher,
      session.session.type,
      session.session.schedule.day,
      session.session.schedule.startTime,
      session.session.schedule.endTime,
      session.session.schedule.frequency,
      session.session.location,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utec-schedule-${studentInfo?.period || 'export'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (selectedSessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Download className="h-5 w-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">Export Schedule</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={exportToJSON}
          className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileJson className="h-8 w-8 text-blue-500" />
          <span className="text-sm font-medium">JSON</span>
          <span className="text-xs text-gray-500">Raw data</span>
        </button>
        
        <button
          type="button"
          onClick={exportToCSV}
          className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileSpreadsheet className="h-8 w-8 text-green-500" />
          <span className="text-sm font-medium">CSV</span>
          <span className="text-xs text-gray-500">Spreadsheet</span>
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Export your schedule data for use in other applications
      </p>
    </div>
  );
}
