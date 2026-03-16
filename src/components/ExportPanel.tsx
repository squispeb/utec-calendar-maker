import { useMemo, useState } from "react";
import { CalendarDays, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { useScheduleStore } from "../store/scheduleStore";
import { getAvailableSeats } from "../utils/capacity";
import {
    createScheduleIcs,
    getDefaultWeekAStartDate,
    getSemesterEndDate,
} from "../utils/ics";

export function ExportPanel() {
    const selectedConfigurations = useScheduleStore(
        (state) => state.selectedConfigurations,
    );
    const studentInfo = useScheduleStore(
        (state) => state.parsedSchedule?.studentInfo,
    );
    const [icsError, setIcsError] = useState<string | null>(null);
    const [weekAStartDate, setWeekAStartDate] = useState(() =>
        getDefaultWeekAStartDate(),
    );
    const semesterEndDate = useMemo(
        () => getSemesterEndDate(weekAStartDate),
        [weekAStartDate],
    );

    const icsFileName = useMemo(
        () => `utec-schedule-${studentInfo?.period || "export"}.ics`,
        [studentInfo?.period],
    );

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
            enrolled: session.enrolled,
            vacancies: session.vacancies,
            availableSeats: getAvailableSeats(session),
        })),
    );

    const exportToJSON = () => {
        const data = {
            studentInfo,
            selections: selectedConfigurations,
            exportDate: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `utec-schedule-${studentInfo?.period || "export"}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportToCSV = () => {
        const headers = [
            "Código del curso",
            "Nombre del curso",
            "Sección",
            "Docente",
            "Tipo de sesión",
            "Grupo",
            "Día",
            "Hora de inicio",
            "Hora de fin",
            "Frecuencia",
            "Ubicación",
            "Matriculados",
            "Vacantes",
            "Cupos libres",
        ];

        const csvContent = [
            headers.join(","),
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
                    row.enrolled.toString(),
                    row.vacancies.toString(),
                    row.availableSeats.toString(),
                ]
                    .map((value) => `"${value}"`)
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `utec-schedule-${studentInfo?.period || "export"}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportToICS = () => {
        try {
            const icsContent = createScheduleIcs({
                selectedConfigurations,
                studentInfo,
                weekAStartDate,
            });

            const blob = new Blob([icsContent], {
                type: "text/calendar;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = icsFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setIcsError(null);
        } catch (error) {
            setIcsError(
                error instanceof Error
                    ? error.message
                    : "No se pudo generar el archivo ICS.",
            );
        }
    };

    if (selectedConfigurations.length === 0) {
        return (
            <div className="border border-[var(--color-border)] bg-[var(--color-page)] px-5 py-8">
                <div className="flex items-start gap-3">
                    <Download
                        className="mt-1 h-5 w-5 text-[var(--color-text-subtle)]"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="font-heading text-2xl text-[var(--color-text)]">
                            Todavía no tienes nada para exportar
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                            Elige por lo menos una opción completa de curso
                            antes de descargar tu horario en JSON, CSV o ICS.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
                <div className="border border-[var(--color-border)] bg-[var(--color-page)] p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                                Calendario externo
                            </p>
                            <h4 className="mt-3 font-heading text-2xl text-[var(--color-text)]">
                                Descargar ICS
                            </h4>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                            <CalendarDays className="h-5 w-5" aria-hidden="true" />
                        </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
                        Exporta tus sesiones para Apple Calendar, Google
                        Calendar, Outlook o cualquier app compatible con
                        iCalendar.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                        <label className="flex flex-col gap-1.5 text-sm text-[var(--color-text)]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                                Inicio Semana A
                            </span>
                            <input
                                type="date"
                                value={weekAStartDate}
                                onChange={(event) =>
                                    setWeekAStartDate(event.target.value)
                                }
                                className="w-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-2 text-sm text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
                            />
                        </label>

                        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                                Duracion fija
                            </span>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                16 semanas
                            </p>
                        </div>
                    </div>

                    <p className="mt-3 text-xs leading-6 text-[var(--color-text-muted)]">
                        Usa el lunes de la primera Semana A real de tu ciclo.
                        Las sesiones de Semana B se desplazan automaticamente una
                        semana despues. El archivo ICS se genera por un semestre
                        completo de 16 semanas, hasta {semesterEndDate.toLocaleDateString("es-PE")}.
                    </p>

                    {icsError ? (
                        <p className="mt-3 text-sm text-[var(--color-danger)]">
                            {icsError}
                        </p>
                    ) : null}

                    <button
                        type="button"
                        onClick={exportToICS}
                        className="mt-5 inline-flex items-center gap-2 border border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    >
                        Descargar ICS
                    </button>
                </div>

                <ExportCard
                    icon={FileJson}
                    eyebrow="Formato completo"
                    title="Descargar JSON"
                    description="Guarda toda la información del horario, incluyendo las opciones elegidas y todas las sesiones generadas."
                    actionLabel="Bajar JSON"
                    onClick={exportToJSON}
                    accent="text-[var(--color-primary)]"
                    border="border-[var(--color-primary)]"
                />
                <ExportCard
                    icon={FileSpreadsheet}
                    eyebrow="Formato simple"
                    title="Descargar CSV"
                    description="Pasa las sesiones elegidas a una fila por cada horario para que puedas revisarlas en Excel o en otra herramienta."
                    actionLabel="Bajar CSV"
                    onClick={exportToCSV}
                    accent="text-[var(--color-accent)]"
                    border="border-[var(--color-accent)]"
                />
            </div>
            <p className="text-sm leading-7 text-[var(--color-text-muted)]">
                Solo se exportan las opciones que tienes seleccionadas en este
                momento. Si dejaste algo incompleto, no se va a incluir en el
                archivo final. El ICS usa la fecha de inicio de Semana A y crea
                recurrencias para un semestre de 16 semanas.
            </p>
        </div>
    );
}

function ExportCard({
    icon: Icon,
    eyebrow,
    title,
    description,
    actionLabel,
    onClick,
    accent,
    border,
}: {
    icon: typeof FileJson;
    eyebrow: string;
    title: string;
    description: string;
    actionLabel: string;
    onClick: () => void;
    accent: string;
    border: string;
}) {
    return (
        <div className={`border bg-[var(--color-page)] p-4 ${border}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p
                        className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}
                    >
                        {eyebrow}
                    </p>
                    <h4 className="mt-3 font-heading text-2xl text-[var(--color-text)]">
                        {title}
                    </h4>
                </div>
                <div
                    className={`flex h-11 w-11 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] ${accent}`}
                >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
                {description}
            </p>

            <button
                type="button"
                onClick={onClick}
                className={`mt-5 inline-flex items-center gap-2 border bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--color-primary-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${border} ${accent}`}
            >
                {actionLabel}
            </button>
        </div>
    );
}
