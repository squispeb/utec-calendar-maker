import type { DayOfWeek, Frequency, SelectedConfiguration, StudentInfo } from "../types";

const LIMA_TIMEZONE = "America/Lima";
const DAY_OFFSETS: Record<DayOfWeek, number> = {
    Lun: 0,
    Mar: 1,
    Mie: 2,
    Jue: 3,
    Vie: 4,
    Sab: 5,
    Dom: 6,
};

type IcsExportOptions = {
    selectedConfigurations: SelectedConfiguration[];
    studentInfo?: StudentInfo | null;
    weekAStartDate: string;
};

const SEMESTER_WEEKS = 16;

function pad(value: number) {
    return value.toString().padStart(2, "0");
}

function formatDateInput(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateInput(value: string) {
    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) {
        throw new Error("Fecha invalida para exportacion ICS");
    }

    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function getMondayAnchor(date: Date) {
    const anchor = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const day = anchor.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    return addDays(anchor, diffToMonday);
}

function atTime(date: Date, time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours ?? 0,
        minutes ?? 0,
        0,
        0,
    );
}

function formatLocalDateTime(date: Date) {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function formatUtcDateTime(date: Date) {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcsText(value: string) {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}

function foldIcsLine(line: string) {
    if (line.length <= 74) {
        return line;
    }

    const parts: string[] = [];
    let cursor = line;

    while (cursor.length > 74) {
        parts.push(cursor.slice(0, 74));
        cursor = ` ${cursor.slice(74)}`;
    }

    parts.push(cursor);
    return parts.join("\r\n");
}

function getIntervalForFrequency(frequency: Frequency) {
    return frequency === "Semana General" ? 1 : 2;
}

function getAnchorForFrequency(weekAStart: Date, frequency: Frequency) {
    if (frequency === "Semana B") {
        return addDays(weekAStart, 7);
    }

    return weekAStart;
}

function countOccurrences(firstOccurrence: Date, periodEndDate: Date, intervalWeeks: number) {
    let count = 0;
    let cursor = new Date(firstOccurrence);

    while (cursor <= periodEndDate) {
        count += 1;
        cursor = addDays(cursor, intervalWeeks * 7);
    }

    return count;
}

export function getDefaultWeekAStartDate(reference = new Date()) {
    return formatDateInput(getMondayAnchor(reference));
}

export function getSemesterEndDate(weekAStartDate: string) {
    const weekAStart = parseDateInput(weekAStartDate);
    return addDays(weekAStart, SEMESTER_WEEKS * 7 - 1);
}

export function createScheduleIcs({
    selectedConfigurations,
    studentInfo,
    weekAStartDate,
}: IcsExportOptions) {
    const weekAStart = getMondayAnchor(parseDateInput(weekAStartDate));
    const periodEnd = getSemesterEndDate(weekAStartDate);
    periodEnd.setHours(23, 59, 59, 999);

    const now = new Date();
    const events: string[] = [];

    for (const configuration of selectedConfigurations) {
        for (const session of configuration.sessions) {
            const anchor = getAnchorForFrequency(weekAStart, session.schedule.frequency);
            const firstOccurrenceDate = addDays(
                anchor,
                DAY_OFFSETS[session.schedule.day],
            );
            const eventStart = atTime(firstOccurrenceDate, session.schedule.startTime);
            const eventEnd = atTime(firstOccurrenceDate, session.schedule.endTime);
            const intervalWeeks = getIntervalForFrequency(session.schedule.frequency);
            const occurrenceCount = countOccurrences(
                eventStart,
                periodEnd,
                intervalWeeks,
            );

            if (occurrenceCount === 0) {
                continue;
            }

            const description = [
                `Codigo: ${configuration.courseCode}`,
                `Curso: ${configuration.courseName}`,
                `Docente: ${session.teacher || configuration.teacher}`,
                `Seccion: ${configuration.sectionId}`,
                `Sesion: ${session.type} ${session.group}`,
                `Frecuencia: ${session.schedule.frequency}`,
                `Ubicacion: ${session.location || "Por confirmar"}`,
            ].join("\n");

            const lines = [
                "BEGIN:VEVENT",
                `UID:${escapeIcsText(`${session.id}-${weekAStartDate}@utec-calendar-maker`)}`,
                `DTSTAMP:${formatUtcDateTime(now)}`,
                `SUMMARY:${escapeIcsText(`${configuration.courseCode} · ${configuration.courseName} (${session.type} ${session.group})`)}`,
                `DESCRIPTION:${escapeIcsText(description)}`,
                `LOCATION:${escapeIcsText(session.location || "Por confirmar")}`,
                `DTSTART;TZID=${LIMA_TIMEZONE}:${formatLocalDateTime(eventStart)}`,
                `DTEND;TZID=${LIMA_TIMEZONE}:${formatLocalDateTime(eventEnd)}`,
                `RRULE:FREQ=WEEKLY;INTERVAL=${intervalWeeks};COUNT=${occurrenceCount}`,
                "STATUS:CONFIRMED",
                "END:VEVENT",
            ];

            events.push(lines.map(foldIcsLine).join("\r\n"));
        }
    }

    if (events.length === 0) {
        throw new Error("No hay sesiones dentro del rango elegido para exportar.");
    }

    const calendarName = studentInfo?.period
        ? `UTEC Calendar Maker ${studentInfo.period}`
        : "UTEC Calendar Maker";

    const calendarLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//UTEC Calendar Maker//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
        `X-WR-TIMEZONE:${LIMA_TIMEZONE}`,
        "BEGIN:VTIMEZONE",
        `TZID:${LIMA_TIMEZONE}`,
        `X-LIC-LOCATION:${LIMA_TIMEZONE}`,
        "BEGIN:STANDARD",
        "TZOFFSETFROM:-0500",
        "TZOFFSETTO:-0500",
        "TZNAME:-05",
        "DTSTART:19700101T000000",
        "END:STANDARD",
        "END:VTIMEZONE",
        ...events,
        "END:VCALENDAR",
    ];

    return `${calendarLines.map(foldIcsLine).join("\r\n")}\r\n`;
}
