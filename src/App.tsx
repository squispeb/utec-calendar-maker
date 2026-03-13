import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PDFUploader } from './components/PDFUploader';
import { CourseBrowser } from './components/CourseBrowser';
import { ScheduleView } from './components/ScheduleView';
import { ExportPanel } from './components/ExportPanel';
import { useScheduleStore } from './store/scheduleStore';
import { GraduationCap, Calendar, BookOpen } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const parsedSchedule = useScheduleStore((state) => state.parsedSchedule);
  const selectedSessions = useScheduleStore((state) => state.selectedSessions);
  const setParsedSchedule = useScheduleStore((state) => state.setParsedSchedule);
  const clearSelectedSessions = useScheduleStore((state) => state.clearSelectedSessions);
  const [showUpload, setShowUpload] = useState(false);

  const handleNewUpload = () => {
    clearSelectedSessions();
    setParsedSchedule(null);
    setShowUpload(true);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
  };

  const shouldShowUpload = showUpload || !parsedSchedule;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">UTEC Calendar Maker</h1>
            </div>
            
            {parsedSchedule && !showUpload && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{parsedSchedule.studentInfo.name}</span>
                <span className="text-gray-300">|</span>
                <span>{parsedSchedule.studentInfo.career}</span>
                <span className="text-gray-300">|</span>
                <span>{parsedSchedule.studentInfo.period}</span>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {shouldShowUpload ? (
            /* Upload Screen */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Build Your Perfect Schedule
                </h2>
                <p className="text-lg text-gray-600">
                  Upload your UTEC schedule PDF and easily select courses, 
                  detect conflicts, and export your calendar.
                </p>
              </div>
              
              <PDFUploader onUploadSuccess={handleUploadSuccess} />
              
              <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                <div className="p-4">
                  <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Browse Courses</h3>
                  <p className="text-sm text-gray-600">
                    Filter and explore all available courses and sections
                  </p>
                </div>
                <div className="p-4">
                  <Calendar className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Detect Conflicts</h3>
                  <p className="text-sm text-gray-600">
                    Automatic conflict detection with visual feedback
                  </p>
                </div>
                <div className="p-4">
                  <GraduationCap className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Export</h3>
                  <p className="text-sm text-gray-600">
                    Download your schedule in multiple formats
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Main Application */
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar - Course Browser */}
              <div className="col-span-5 space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Available Courses</h2>
                    <button
                      type="button"
                      onClick={handleNewUpload}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Upload New PDF
                    </button>
                  </div>
                  <CourseBrowser />
                </div>
              </div>

              {/* Right Panel - Schedule & Export */}
              <div className="col-span-7 space-y-6">
                {/* Schedule View */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Schedule
                    {selectedSessions.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({selectedSessions.length} sessions selected)
                      </span>
                    )}
                  </h2>
                  <ScheduleView />
                </div>

                {/* Export Panel */}
                <ExportPanel />
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-500">
              UTEC Calendar Maker - Built with TanStack + Vite
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
