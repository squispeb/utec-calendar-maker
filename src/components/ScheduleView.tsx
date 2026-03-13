import { useMemo } from "react";
import { AlertCircle, ArrowLeft, X } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "./layout";
import { useScheduleStore } from "../store/scheduleStore";
import { formatDay, timeToMinutes } from "../utils/conflictDetection";
import { deriveTeacherName } from "../utils/courseConfigurations";
import type { DayOfWeek, SelectedConfiguration, Session } from "../types";

const DAYS: DayOfWeek[] = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 56;
const DAY_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

const COURSE_COLOR_PALETTE = [
    {
        card: "border-sky-500 bg-sky-100 text-sky-950",
        summary: "border-l-sky-500",
    },
    {
        card: "border-emerald-500 bg-emerald-100 text-emerald-950",
        summary: "border-l-emerald-500",
    },
    {
        card: "border-amber-500 bg-amber-100 text-amber-950",
        summary: "border-l-amber-500",
    },
    {
        card: "border-fuchsia-500 bg-fuchsia-100 text-fuchsia-950",
        summary: "border-l-fuchsia-500",
    },
    {
        card: "border-violet-500 bg-violet-100 text-violet-950",
        summary: "border-l-violet-500",
    },
    {
        card: "border-rose-500 bg-rose-100 text-rose-950",
        summary: "border-l-rose-500",
    },
    {
        card: "border-cyan-500 bg-cyan-100 text-cyan-950",
        summary: "border-l-cyan-500",
    },
    {
        card: "border-lime-500 bg-lime-100 text-lime-950",
        summary: "border-l-lime-500",
    },
];

type ScheduledMeeting = {
    configuration: SelectedConfiguration;
    session: Session;
};

function buildCourseColorMap(selectedConfigurations: SelectedConfiguration[]) {
    const assignments = new Map<
        string,
        (typeof COURSE_COLOR_PALETTE)[number]
    >();

    const ordered = [...selectedConfigurations].sort((a, b) =>
        a.courseCode.localeCompare(b.courseCode, undefined, { numeric: true }),
    );

    ordered.forEach((configuration, index) => {
        assignments.set(
            configuration.courseId,
            COURSE_COLOR_PALETTE[index % COURSE_COLOR_PALETTE.length],
        );
    });

    return assignments;
}

export function ScheduleView() {
    const selectedConfigurations = useScheduleStore(
        (state) => state.selectedConfigurations,
    );
    const conflicts = useScheduleStore((state) => state.conflicts);
    const removeSelectedCourse = useScheduleStore(
        (state) => state.removeSelectedCourse,
    );

    const meetings = useMemo<ScheduledMeeting[]>(() => {
        return selectedConfigurations.flatMap((configuration) =>
            configuration.sessions.map((session) => ({
                configuration,
                session,
            })),
        );
    }, [selectedConfigurations]);

    const courseColorMap = useMemo(
        () => buildCourseColorMap(selectedConfigurations),
        [selectedConfigurations],
    );

    const meetingsByDay = useMemo(() => {
        const byDay: Record<DayOfWeek, ScheduledMeeting[]> = {
            Lun: [],
            Mar: [],
            Mie: [],
            Jue: [],
            Vie: [],
            Sab: [],
            Dom: [],
        };

        for (const meeting of meetings) {
            byDay[meeting.session.schedule.day].push(meeting);
        }

        return byDay;
    }, [meetings]);

    const isMeetingInConflict = (meeting: ScheduledMeeting) => {
        return conflicts.some(
            (conflict) =>
                conflict.firstSession.id === meeting.session.id ||
                conflict.secondSession.id === meeting.session.id,
        );
    };

    const getMeetingStyle = (session: Session) => {
        const startMinutes = timeToMinutes(session.schedule.startTime);
        const endMinutes = timeToMinutes(session.schedule.endTime);
        const duration = endMinutes - startMinutes;
        const top = (startMinutes - START_HOUR * 60) * (HOUR_HEIGHT / 60);
        const height = duration * (HOUR_HEIGHT / 60);

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    const isEmpty = selectedConfigurations.length === 0;

    return (
        <div className="flex flex-col" style={{ gap: "var(--space-gap)" }}>
            {!isEmpty && conflicts.length > 0 ? (
                <div
                    className="border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] text-[var(--color-danger)]"
                    style={{ padding: "var(--space-section)" }}
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5" />
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                                Conflict review
                            </p>
                            <ul className="mt-2 space-y-1 text-sm leading-7">
                                {conflicts.map((conflict) => (
                                    <li
                                        key={`conflict-${conflict.firstSession.id}-${conflict.secondSession.id}`}
                                    >
                                        {conflict.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : null}

            <p
                className="text-xs text-[var(--color-text-subtle)]"
                aria-live="polite"
            >
                <span className="sm:hidden">
                    Scroll horizontally to see all days.
                </span>
            </p>
            <div className="relative overflow-x-auto border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
                <div className="grid min-w-[960px] grid-cols-[72px_repeat(6,minmax(140px,1fr))]">
                    <div className="border-b border-r border-[var(--color-border)] bg-[var(--color-page)] px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                        Time
                    </div>
                    {DAYS.map((day) => (
                        <div
                            key={day}
                            className="border-b border-r border-[var(--color-border)] bg-[var(--color-page)] px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)] last:border-r-0"
                        >
                            {formatDay(day)}
                        </div>
                    ))}

                    <div
                        className="relative border-r border-[var(--color-border)] bg-[var(--color-surface)]"
                        style={{ height: `${DAY_HEIGHT}px` }}
                    >
                        {Array.from(
                            { length: END_HOUR - START_HOUR + 1 },
                            (_, index) => START_HOUR + index,
                        ).map((hour) => {
                            const top = (hour - START_HOUR) * HOUR_HEIGHT;

                            return (
                                <div
                                    key={`time-${hour}`}
                                    className="absolute left-0 right-0 border-t border-[var(--color-border)] pr-2 text-right text-[11px] text-[var(--color-text-subtle)]"
                                    style={{
                                        top: `${top}px`,
                                        transform: "translateY(-50%)",
                                    }}
                                >
                                    {hour}:00
                                </div>
                            );
                        })}
                    </div>

                    {DAYS.map((day) => (
                        <DayColumn
                            key={day}
                            meetings={meetingsByDay[day]}
                            courseColorMap={courseColorMap}
                            isMeetingInConflict={isMeetingInConflict}
                            getMeetingStyle={getMeetingStyle}
                            onRemoveCourse={removeSelectedCourse}
                        />
                    ))}
                </div>

                {isEmpty ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-surface)_82%,white)] p-4 text-center">
                        <div className="max-w-md">
                            <p className="font-heading text-3xl text-[var(--color-text)]">
                                Your weekly board is still empty
                            </p>
                            <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                                Select at least one complete course
                                configuration from the library and the calendar
                                will begin to fill itself.
                            </p>
                            <div className="mt-6 inline-flex items-center gap-2 border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)]">
                                <ArrowLeft
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Start in the Selection Library on the left
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <Panel
                noPadding
                className="border-[var(--color-border)]"
                style={{ background: "var(--color-page)" }}
            >
                <PanelHeader className="shrink-0">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                        Selected configurations
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                        Each row below mirrors the active course bundle rendered
                        in the calendar above.
                    </p>
                </PanelHeader>

                <PanelBody className="min-h-0 max-h-[28rem] overflow-y-auto">
                    <div
                        className="flex flex-col"
                        style={{ gap: "calc(var(--space-gap) * 0.75)" }}
                    >
                        {selectedConfigurations.map((configuration) => {
                            const hasConflict = conflicts.some(
                                (conflict) =>
                                    conflict.selection1.id ===
                                        configuration.id ||
                                    conflict.selection2.id === configuration.id,
                            );
                            const color =
                                courseColorMap.get(configuration.courseId) ??
                                COURSE_COLOR_PALETTE[0];

                            return (
                                <div
                                    key={configuration.id}
                                    className={`border-l-4 border border-[var(--color-border)] bg-[var(--color-surface)] ${color.summary} ${hasConflict ? "border-[var(--color-danger)]" : ""}`}
                                    style={{ padding: "var(--space-section)" }}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-heading text-2xl text-[var(--color-text)]">
                                                {configuration.courseCode} ·{" "}
                                                {configuration.courseName}
                                            </p>
                                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                                Section{" "}
                                                {configuration.sectionId} ·{" "}
                                                {configuration.teacher}
                                            </p>
                                            <div className="mt-3 space-y-1.5 text-sm text-[var(--color-text-muted)]">
                                                {configuration.sessions.map(
                                                    (session) => (
                                                        <div key={session.id}>
                                                            {formatDay(
                                                                session.schedule
                                                                    .day,
                                                            )}{" "}
                                                            {
                                                                session.schedule
                                                                    .startTime
                                                            }
                                                            -
                                                            {
                                                                session.schedule
                                                                    .endTime
                                                            }{" "}
                                                            · {session.type}{" "}
                                                            {session.group}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasConflict ? (
                                                <AlertCircle
                                                    className="h-4 w-4 text-[var(--color-danger)]"
                                                    aria-hidden="true"
                                                />
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeSelectedCourse(
                                                        configuration.courseId,
                                                    )
                                                }
                                                aria-label={`Remove ${configuration.courseName} from schedule`}
                                                className="flex h-9 w-9 items-center justify-center border border-[var(--color-border)] bg-[var(--color-page)] text-[var(--color-text-subtle)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2"
                                            >
                                                <X
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </PanelBody>
            </Panel>
        </div>
    );
}

interface DayColumnProps {
    meetings: ScheduledMeeting[];
    courseColorMap: Map<string, (typeof COURSE_COLOR_PALETTE)[number]>;
    isMeetingInConflict: (meeting: ScheduledMeeting) => boolean;
    getMeetingStyle: (session: Session) => { top: string; height: string };
    onRemoveCourse: (courseId: string) => void;
}

function DayColumn({
    meetings,
    courseColorMap,
    isMeetingInConflict,
    getMeetingStyle,
    onRemoveCourse,
}: DayColumnProps) {
    return (
        <div
            className="relative border-r border-[var(--color-border)] bg-[var(--color-surface)] last:border-r-0"
            style={{ height: `${DAY_HEIGHT}px` }}
        >
            {Array.from(
                { length: END_HOUR - START_HOUR + 1 },
                (_, index) => START_HOUR + index,
            ).map((hour) => {
                const top = (hour - START_HOUR) * HOUR_HEIGHT;

                return (
                    <div
                        key={hour}
                        className="pointer-events-none absolute left-0 right-0 border-t border-[var(--color-border)]"
                        style={{ top: `${top}px` }}
                    />
                );
            })}

            {meetings.map((meeting) => {
                const inConflict = isMeetingInConflict(meeting);
                const color =
                    courseColorMap.get(meeting.configuration.courseId) ??
                    COURSE_COLOR_PALETTE[0];
                const displayTeacher =
                    meeting.session.teacher &&
                    meeting.session.teacher !== "Unknown"
                        ? meeting.session.teacher
                        : deriveTeacherName([meeting.session]);

                return (
                    <div
                        key={meeting.session.id}
                        className={`absolute inset-x-1 border px-2 py-2 text-xs ${color.card} ${
                            inConflict
                                ? "ring-2 ring-[var(--color-danger)] ring-offset-1"
                                : ""
                        }`}
                        style={getMeetingStyle(meeting.session)}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                onRemoveCourse(meeting.configuration.courseId)
                            }
                            aria-label={`Remove ${meeting.configuration.courseCode} from schedule`}
                            className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center text-current opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-1"
                        >
                            <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <div className="truncate pr-4 font-semibold">
                            {meeting.configuration.courseCode}
                        </div>
                        <div className="truncate pr-4 text-[11px] opacity-85">
                            {displayTeacher}
                        </div>
                        <div className="truncate mt-1">
                            {meeting.session.type} {meeting.session.group}
                        </div>
                        <div className="mt-1 opacity-80">
                            {meeting.session.schedule.startTime}-
                            {meeting.session.schedule.endTime}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
