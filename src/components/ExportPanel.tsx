import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { useScheduleStore } from '../store/scheduleStore'

export function ExportPanel() {
  const selectedConfigurations = useScheduleStore((state) => state.selectedConfigurations)
  const studentInfo = useScheduleStore((state) => state.parsedSchedule?.studentInfo)

  const rows = selectedConfigurations.flatMap((configuration) =>
    configuration.sessions.map((session) => ({
      courseCode: configuration.courseCode,
      courseName: configuration.courseName,
      sectionId: configuration.sectionId,
      teacher: configuration.teacher,
      sessionType: session.type,
      group: session.group,
      day: session.schedule.day,
      startTime: session.schedule.startTime,
      endTime: session.schedule.endTime,
      frequency: session.schedule.frequency,
      location: session.location,
    })),
  )

  const exportToJSON = () => {
    const data = {
      studentInfo,
      selections: selectedConfigurations,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `utec-schedule-${studentInfo?.period || 'export'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    const headers = [
      'Course Code',
      'Course Name',
      'Section',
      'Teacher',
      'Session Type',
      'Group',
      'Day',
      'Start Time',
      'End Time',
      'Frequency',
      'Location',
    ]

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        [
          row.courseCode,
          row.courseName,
          row.sectionId.toString(),
          row.teacher,
          row.sessionType,
          row.group,
          row.day,
          row.startTime,
          row.endTime,
          row.frequency,
          row.location,
        ]
          .map((value) => `"${value}"`)
          .join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `utec-schedule-${studentInfo?.period || 'export'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (selectedConfigurations.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">Export Schedule</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={exportToJSON}
          className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
        >
          <FileJson className="h-8 w-8 text-blue-500" />
          <span className="text-sm font-medium">JSON</span>
          <span className="text-xs text-gray-500">Selections and meetings</span>
        </button>

        <button
          type="button"
          onClick={exportToCSV}
          className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
        >
          <FileSpreadsheet className="h-8 w-8 text-green-500" />
          <span className="text-sm font-medium">CSV</span>
          <span className="text-xs text-gray-500">One row per meeting</span>
        </button>
      </div>
    </div>
  )
}
