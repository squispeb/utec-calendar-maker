# UTEC Calendar Maker - Project Plan

## Project Overview

Build a web application using **TanStack + Vite** that processes UTEC course schedule PDFs and enables students to:
- Upload and parse schedule PDFs
- Browse and filter available courses
- Select sections/groups with visual feedback
- Detect schedule conflicts
- Generate optimized calendars
- Export in multiple formats (ICS, CSV, JSON)

## Data Model (from PDF Analysis)

### Course Structure
```
Course
├── code: string          (e.g., "CS2032")
├── name: string          (e.g., "Cloud Computing")
├── type: "Obligatorio" | "Electivo"
├── modality: "Presencial" | "Sincronico" | "Virtual"
├── credits?: number
└── sections: Section[]

Section
├── id: number            (e.g., 1, 2, 3)
├── teacher: string
├── sessions: Session[]

Session
├── type: "Teoría" | "Laboratorio" | "Virtual"
├── group: string         (e.g., "11", "12", "21")
├── schedule: Schedule
├── location: string
├── vacancies: number
├── enrolled: number

Schedule
├── day: string           (e.g., "Lun", "Mar", "Mie", "Jue", "Vie", "Sab")
├── startTime: string     (e.g., "19:00")
├── endTime: string       (e.g., "20:00")
├── frequency: "Semana General" | "Semana A" | "Semana B"
```

## Technical Stack

- **Package Manager**: Bun
- **Framework**: Vite + React + TypeScript
- **State Management**: TanStack Query (React Query) + Zustand (local persistence)
- **Table/Grid**: TanStack Table (for course listing)
- **API Routes**: Hono (under `/api`)
- **UI Components**: shadcn/ui or Chakra UI
- **PDF Processing**: pdf-parse (server-side in API routes)
- **Styling**: Tailwind CSS
- **Date/Time**: date-fns
- **Icons**: Lucide React

## Project Structure

```
/src
├── /api                    # API routes (Hono)
│   └── /pdf               # PDF processing endpoints
├── /components            # React components
│   ├── /ui               # UI components
│   ├── /course           # Course-related components
│   ├── /schedule         # Schedule/calendar components
│   └── /layout           # Layout components
├── /hooks                 # Custom React hooks
├── /lib                   # Utility functions
├── /store                 # Zustand stores
├── /types                 # TypeScript types
├── /utils                 # Helper functions
└── /parser                # PDF data parser
```

## Implementation Phases

### Phase 1: Foundation
- [x] Initialize Vite project with Bun
- [ ] Install and configure TanStack dependencies
- [ ] Set up Tailwind CSS
- [ ] Create TypeScript interfaces/types
- [ ] Set up Zustand store with persistence

### Phase 2: Data Processing
- [ ] Create API route structure with Hono
- [ ] Implement PDF upload endpoint
- [ ] Build PDF to markdown parser
- [ ] Create markdown to structured JSON converter
- [ ] Data validation and normalization

### Phase 3: Core Features
- [ ] PDF upload component
- [ ] Course browser with TanStack Table
- [ ] Filtering system (type, modality, teacher, schedule)
- [ ] Section/Group selection
- [ ] Schedule conflict detection

### Phase 4: Visualization
- [ ] Calendar view component
- [ ] Weekly schedule visualization
- [ ] Conflict highlighting

### Phase 5: Export
- [ ] ICS (iCalendar) export
- [ ] CSV export
- [ ] JSON export

## Conflict Detection Rules

1. **Time Overlap**: Two sessions overlap if their time ranges intersect
2. **Week Pattern**: Consider "Semana A/B" patterns
   - "Semana General" conflicts with both A and B
   - "Semana A" only conflicts with A
   - "Semana B" only conflicts with B
3. **Day of Week**: Only check conflicts on the same day
4. **Virtual/Physical**: No location conflicts for virtual sessions

## UI Design

- **Target**: Desktop-focused
- **No dark/light mode toggle** (use system preference or single theme)
- Clean, modern interface with clear visual hierarchy
- Use Lucide icons for consistency
