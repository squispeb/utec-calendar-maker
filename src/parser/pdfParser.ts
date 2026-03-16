import type { Course, Session, StudentInfo, ParsedSchedule, DayOfWeek, SessionType, Modality, CourseType, Frequency } from '../types';

const DAY_MAP: Record<string, DayOfWeek> = {
  'Lun': 'Lun', 'Lunes': 'Lun',
  'Mar': 'Mar', 'Martes': 'Mar', 
  'Mie': 'Mie', 'Mié': 'Mie', 'Miercoles': 'Mie', 'Miércoles': 'Mie',
  'Jue': 'Jue', 'Jueves': 'Jue',
  'Vie': 'Vie', 'Viernes': 'Vie',
  'Sab': 'Sab', 'Sáb': 'Sab', 'Sábado': 'Sab', 'Sabado': 'Sab',
  'Dom': 'Dom', 'Domingo': 'Dom'
};

const COURSE_CODE_PATTERN = /^(CS|BI|ME|EL|EN|GE|MT|HH|AM|IN)\d{4}/;

// Known course names (from the PDF document)
const COURSE_NAMES: Record<string, string> = {
  'CS2032': 'Cloud Computing',
  'CS4016': 'Computación Gráfica',
  'CS5055': 'Internet de las Cosas',
  'CS5101': 'Proyecto Final de Ciencia de la Computación I',
  'CS2024': 'Teoría de la Computación',
  'CS5384': 'Gestión en Software',
  'BI0017': '3D Bio-printing',
  'BI4011': 'Bioestadística',
  'BI5320': 'BIOMEMS',
  'BI4439': 'Ciencia y Cocina',
  'BI0014': 'Desarrollo y Fabricación de Dispositivos Médicos',
  'ME5306': 'Análisis de Falla y Toma de Decisiones',
  'ME5303': 'Gestión de Equipos y Maquinarias',
  'ME5302': 'Infraestructura Minera',
  'ME5305': 'Ingeniería de la Confiabilidad',
  'ME5301': 'Introducción a la Mineralurgia',
  'ME3017': 'Ingeniería de mantenimiento',
  'ME3016': 'Introducción a la Ingeniería de Minas',
  'ME5403': 'Mecánica de Materiales Avanzado',
  'ME3013': 'Procesos de manufactura',
  'EN5301': 'Análisis de Sistemas eléctricos de potencia',
  'EN5401': 'Biomasa y Geotermia',
  'EN5402': 'Eficiencia Energética Térmica',
  'EN3018': 'Smart Grid',
  'EL3303': 'Control de Procesos',
  'EL3304': 'Diseño de Software',
  'EL3301': 'Instrumentación Industrial',
  'EL3302': 'Introducción a Cognitive Computing',
  'EL4013': 'Introducción a las redes de computadoras',
  'EL4302': 'Sistemas embebidos interconectados',
  'EL5313': 'Procesamiento de Imágenes Digitales',
  'GE4466': 'Construcción de compiladores',
  'GE4459': 'Transformación digital: cómo el uso de datos, agilidad y tecnología está dando forma al futuro de nuestros negocios',
  'MT5001': 'Diseño de Sistemas Mecatrónicos',
  'MT4001': 'Fundamentos de Robótica',
  'MT5304': 'Robótica Autónoma',
  'MT5306': 'Robótica industrial',
  'MT3001': 'Sensores y Actuadores',
  'MT4002': 'Sistemas Hidráulicos y Neumáticos',
  'HH4203': 'Discapacidad: Los Retos de la Inclusión',
  'HH2207': 'Introducción al Quechua',
  'AM1003': 'Biología, Ecología y Recursos Naturales',
  'IN4305': 'Diseño de Redes y Ciencia de la Transportación',
};

export function parseScheduleMarkdown(text: string): ParsedSchedule {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const studentInfo = extractStudentInfo(lines);
  const courses = parseMarkdownTable(text, lines);
  
  return {
    studentInfo,
    courses,
    rawText: text
  };
}

function extractStudentInfo(lines: string[]): StudentInfo {
  const info: StudentInfo = {
    name: '',
    program: '',
    career: '',
    curriculum: '',
    period: '',
    enrollmentDate: ''
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('Alumno') && line.includes(':')) {
      info.name = line.split(':')[1]?.trim() || '';
    }
    if (line.includes('Carrera') && line.includes(':')) {
      info.career = line.split(':')[1]?.trim() || '';
    }
    if (line.includes('Malla') && line.includes(':')) {
      info.curriculum = line.split(':')[1]?.trim() || '';
    }
    if (line.includes('Periodo')) {
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.includes('-')) {
        info.period = nextLine.trim();
      }
    }
    if (line.includes('Turno de Matrícula') && line.includes(':')) {
      info.enrollmentDate = line.split(':')[1]?.trim() || '';
    }
  }
  
  return info;
}

function parseMarkdownTable(text: string, _lines: string[]): Course[] {
  const courses = new Map<string, Course>();
  
  // First pass: collect all lines and group by course code
  const blocks: { code: string; lines: string[] }[] = [];
  let currentBlock: { code: string; lines: string[] } | null = null;
  
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if this line starts with a course code
    const codeMatch = trimmed.match(COURSE_CODE_PATTERN);
    if (codeMatch) {
      // Save previous block
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      // Start new block
      currentBlock = { code: codeMatch[0], lines: [trimmed] };
    } else if (currentBlock) {
      // Add to current block (continuation)
      // Include lines that look like they contain table data or continuation
      if (trimmed.includes('|') || !trimmed.match(/^[\d\s\-]+$/)) {
        currentBlock.lines.push(trimmed);
      }
    }
  }
  
  // Add last block
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  
  // Second pass: parse each block
  for (const block of blocks) {
    const entries = parseBlock(block);
    
    for (const entry of entries) {
      let course = courses.get(entry.code);
      if (!course) {
        course = {
          id: entry.code,
          code: entry.code,
          name: COURSE_NAMES[entry.code] || entry.courseName,
          type: entry.type,
          modality: entry.modality,
          sections: []
        };
        courses.set(entry.code, course);
      }
      
      // Find or create section
      let section = course.sections.find(s => s.id === entry.sectionId);
      if (!section) {
        section = {
          id: entry.sectionId,
          teacher: entry.teacher,
          sessions: []
        };
        course.sections.push(section);
      }
      
      // Create session
      const session: Session = {
        id: `${entry.code}-${entry.sectionId}-${entry.group}-${entry.day}-${entry.startTime}`,
        type: entry.sessionType,
        group: entry.group,
        teacher: entry.teacher,
        schedule: {
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          frequency: entry.frequency
        },
        location: entry.location,
        vacancies: entry.vacancies,
        enrolled: entry.enrolled
      };
      
      section.sessions.push(session);

      const sectionTeachers = [...new Set(section.sessions.map(s => s.teacher).filter(Boolean))]
      section.teacher = sectionTeachers.length === 1 ? sectionTeachers[0] : 'Multiple professors'
    }
  }
  
  return Array.from(courses.values());
}

function parseBlock(block: { code: string; lines: string[] }): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  
  // Join all lines to get full context
  const fullText = block.lines.join(' ');
  
  // Extract all times from the block (may have multiple sessions)
  const timePattern = /(Lun|Mar|Mie|Mié|Jue|Vie|Sab|Sáb|Dom)\.?\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/gi;
  const times: Array<{ day: DayOfWeek; start: string; end: string }> = [];
  
  let timeMatch = timePattern.exec(fullText);
  while (timeMatch !== null) {
    times.push({
      day: DAY_MAP[timeMatch[1]] || 'Lun',
      start: `${timeMatch[2].padStart(2, '0')}:${timeMatch[3]}`,
      end: `${timeMatch[4].padStart(2, '0')}:${timeMatch[5]}`
    });
    timeMatch = timePattern.exec(fullText);
  }
  
  // If no times found, return empty
  if (times.length === 0) return [];
  
  // Extract common fields
  const courseName = COURSE_NAMES[block.code] || extractCourseName(block.lines);
  const teacher = extractTeacher(block.code, block.lines);
  const type: CourseType = fullText.includes('Electivo') ? 'Electivo' : 'Obligatorio';
  const modality = extractModality(fullText);
  const sectionId = extractSectionId(fullText);
  const capacity = extractCapacity(block.lines);
  
  // Create an entry for each time found
  for (const time of times) {
    entries.push({
      code: block.code,
      courseName,
      teacher,
      type,
      modality,
      sectionId,
      sessionType: extractSessionType(fullText),
      group: extractGroup(fullText),
      day: time.day,
      startTime: time.start,
      endTime: time.end,
      frequency: extractFrequency(fullText),
      location: extractLocation(fullText),
      vacancies: capacity.vacancies,
      enrolled: capacity.enrolled
    });
  }
  
  return entries;
}

function extractCourseName(lines: string[]): string {
  // Join lines and look between course code and curriculum
  const text = lines.join(' ');
  const codeMatch = text.match(COURSE_CODE_PATTERN);
  if (!codeMatch) return 'Unknown Course';
  
  const code = codeMatch[0];
  const codeEnd = text.indexOf(code) + code.length;
  
  // Find curriculum pattern (CS-2018-1, etc.)
  const currPattern = /(CS|BI|ME|EL|EN|GE|MT|HH|AM|IN)-\d{4}-\d/;
  const currMatch = text.match(currPattern);
  
  if (currMatch && currMatch.index) {
    const name = text.substring(codeEnd, currMatch.index).trim();
    // Clean up - take first meaningful part
    const parts = name.split(/\s{2,}/);
    if (parts.length > 0) {
      return parts[0].replace(/[|]/g, '').trim();
    }
    return name.replace(/[|]/g, '').trim();
  }
  
  return 'Unknown Course';
}

function extractTeacher(code: string, lines: string[]): string {
  const firstLine = lines[0] ?? '';
  const curriculumMatch = firstLine.match(/(CS|BI|ME|EL|EN|GE|MT|HH|AM|IN)-\d{4}-\d/);
  const teacherParts: string[] = [];
  const courseName = COURSE_NAMES[code] ?? '';

  if (curriculumMatch) {
    const prefix = firstLine.slice(0, firstLine.indexOf(curriculumMatch[0]));
    const withoutCode = prefix.replace(COURSE_CODE_PATTERN, '').trim();
    const split = withoutCode.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
    if (split.length > 1) {
      teacherParts.push(...split.slice(1));
    }
  }

  for (const line of lines.slice(1)) {
    if (line.includes('|') && !line.match(/^\|\s*[-:]+/)) {
      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean);

      if (cells[1] && cells[1] !== '---') {
        teacherParts.push(cells[1]);
      }
      continue;
    }

    if (!line.includes('|') && !COURSE_CODE_PATTERN.test(line)) {
      const normalized = line.replace(/\s+/g, ' ').trim();
      if (!normalized) {
        continue;
      }

      const isCourseSuffix = courseName
        ? courseName.toLowerCase().includes(normalized.toLowerCase())
        : false;

      if (!isCourseSuffix) {
        teacherParts.push(normalized);
      }
    }
  }

  const teacher = teacherParts
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();

  return teacher || 'Unknown';
}

function extractModality(text: string): Modality {
  if (text.includes('Sincronico')) return 'Sincronico';
  if (text.includes('Virtual')) return 'Virtual';
  return 'Presencial';
}

function extractSessionType(text: string): SessionType {
  if (text.includes('Laboratorio')) return 'Laboratorio';
  if (text.includes('Virtual')) return 'Virtual';
  return 'Teoría';
}

function extractSectionId(text: string): number {
  const match = text.match(/(?:Presencial|Sincronico|Virtual)\s+(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function extractGroup(text: string): string {
  const match = text.match(/(?:Teoría|Laboratorio|Virtual)\s+(\d+)/);
  return match ? match[1] : '1';
}

function extractFrequency(text: string): Frequency {
  if (text.includes('Semana A')) return 'Semana A';
  if (text.includes('Semana B')) return 'Semana B';
  return 'Semana General';
}

function extractLocation(text: string): string {
  const patterns = [
    /\bAUDITORIO\b/i,
    /\bVirtual\s+\d+\b/i,
    /\bVirtual\b/i,
    /\b(A\d{3})\b/,
    /\b(M\d{3,4})\b/,
    /\b(L\d{3})\b/,
    /\bUTEC-BA\b/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  
  return '';
}

function extractCapacity(lines: string[]): { vacancies: number; enrolled: number } {
  const candidateLines = lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('|') && !line.match(/^\d+$/));

  for (const line of candidateLines) {
    const ratioMatch = line.match(/(\d+)\s*\/\s*(\d+)\s*$/);
    if (ratioMatch) {
      return {
        enrolled: parseInt(ratioMatch[1], 10),
        vacancies: parseInt(ratioMatch[2], 10),
      };
    }
  }

  for (const line of candidateLines) {
    const trailingPairMatch = line.match(/(\d+)\s+(\d+)\s*$/);
    if (trailingPairMatch) {
      return {
        vacancies: parseInt(trailingPairMatch[1], 10),
        enrolled: parseInt(trailingPairMatch[2], 10),
      };
    }
  }

  return {
    vacancies: 0,
    enrolled: 0,
  };
}

interface ParsedEntry {
  code: string;
  courseName: string;
  teacher: string;
  type: CourseType;
  modality: Modality;
  sectionId: number;
  sessionType: SessionType;
  group: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  frequency: Frequency;
  location: string;
  vacancies: number;
  enrolled: number;
}
