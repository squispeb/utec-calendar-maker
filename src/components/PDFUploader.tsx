import { useCallback, useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { useScheduleStore } from '../store/scheduleStore'
import type { ParsedSchedule } from '../types'

interface PDFUploaderProps {
  onUploadSuccess?: (data: ParsedSchedule) => void
}

export function PDFUploader({ onUploadSuccess }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setParsedSchedule = useScheduleStore((state) => state.setParsedSchedule)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processPDF = useCallback(
    async (file: File) => {
      try {
        setError(null)

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to process PDF')
        }

        const data = payload.parsed as ParsedSchedule

        if (!data?.courses?.length) {
          throw new Error('No courses found in the uploaded PDF')
        }

        setParsedSchedule(data)
        onUploadSuccess?.(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error processing PDF file',
        )
      }
    },
    [onUploadSuccess, setParsedSchedule],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      setError(null)

      const file = e.dataTransfer.files[0]
      if (file && file.type === 'application/pdf') {
        setIsLoading(true)
        await processPDF(file)
        setIsLoading(false)
      } else {
        setError('Please upload a PDF file')
      }
    },
    [processPDF],
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setIsLoading(true)
      setError(null)
      await processPDF(file)
      setIsLoading(false)
      e.target.value = ''
    },
    [processPDF],
  )

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="mx-auto w-full max-w-2xl">
      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
            <p className="text-gray-600">Converting PDF with MarkItDown...</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-lg font-medium text-gray-700">
              Drop your UTEC schedule PDF here
            </p>
            <p className="text-sm text-gray-500">or click to browse files</p>
            <p className="mt-2 text-xs text-gray-400">PDF files only</p>
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <X className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-blue-500" />
          <div>
            <p className="font-medium text-blue-900">Expected Format</p>
            <p className="mt-1 text-sm text-blue-700">
              Upload your UTEC `Horario Carga Habil` PDF. The server converts it
              to markdown with MarkItDown, then parses sections, teachers, and
              schedules into structured data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
