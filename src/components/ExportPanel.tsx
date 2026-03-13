import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { useScheduleStore } from "../store/scheduleStore";

export function ExportPanel() {
    const selectedConfigurations = useScheduleStore(
        (state) => state.selectedConfigurations,
    );
    const studentInfo = useScheduleStore(
        (state) => state.parsedSchedule?.studentInfo,
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
            "Course Code",
            "Course Name",
            "Section",
            "Teacher",
            "Session Type",
            "Group",
            "Day",
            "Start Time",
            "End Time",
            "Frequency",
            "Location",
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
                            Nothing ready to export
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                            Build at least one complete course configuration
                            before creating JSON or CSV output.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <ExportCard
                    icon={FileJson}
                    eyebrow="Structured archive"
                    title="Export JSON"
                    description="Keep the full configuration graph, including selected bundles and all generated meetings."
                    actionLabel="Download JSON"
                    onClick={exportToJSON}
                    accent="text-[var(--color-primary)]"
                    border="border-[var(--color-primary)]"
                />
                <ExportCard
                    icon={FileSpreadsheet}
                    eyebrow="Spreadsheet review"
                    title="Export CSV"
                    description="Flatten the chosen meetings into one row per event for spreadsheets or external planning tools."
                    actionLabel="Download CSV"
                    onClick={exportToCSV}
                    accent="text-[var(--color-accent)]"
                    border="border-[var(--color-accent)]"
                />
            </div>
            <p className="text-sm leading-7 text-[var(--color-text-muted)]">
                Exports use the currently selected course configurations only,
                so incomplete draft choices stay out of the final files.
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
