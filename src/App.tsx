import { useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    ArrowUpRight,
    BookOpen,
    CalendarRange,
    FileUp,
    GraduationCap,
    LayoutPanelTop,
    ScanSearch,
    ShieldAlert,
} from "lucide-react";
import { PDFUploader } from "./components/PDFUploader";
import { CourseBrowser } from "./components/CourseBrowser";
import { ScheduleView } from "./components/ScheduleView";
import { ExportPanel } from "./components/ExportPanel";
import { useScheduleStore } from "./store/scheduleStore";
import {
    PageContainer,
    SectionStack,
    Panel,
    PanelHeader,
    PanelBody,
} from "./components/layout";

const queryClient = new QueryClient();

function App() {
    const parsedSchedule = useScheduleStore((state) => state.parsedSchedule);
    const selectedConfigurations = useScheduleStore(
        (state) => state.selectedConfigurations,
    );
    const conflicts = useScheduleStore((state) => state.conflicts);
    const setParsedSchedule = useScheduleStore(
        (state) => state.setParsedSchedule,
    );
    const clearSelectedConfigurations = useScheduleStore(
        (state) => state.clearSelectedConfigurations,
    );
    const [showUpload, setShowUpload] = useState(false);
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const confirmClearRef = useRef<HTMLButtonElement>(null);

    const handleNewUpload = () => {
        if (selectedConfigurations.length > 0) {
            setShowConfirmClear(true);
        } else {
            clearSelectedConfigurations();
            setParsedSchedule(null);
            setShowUpload(true);
        }
    };

    const handleConfirmClear = () => {
        setShowConfirmClear(false);
        clearSelectedConfigurations();
        setParsedSchedule(null);
        setShowUpload(true);
    };

    const handleCancelClear = () => {
        setShowConfirmClear(false);
    };

    const handleUploadSuccess = () => {
        setShowUpload(false);
    };

    const shouldShowUpload = showUpload || !parsedSchedule;

    const overview = useMemo(() => {
        const courseCount = parsedSchedule?.courses.length ?? 0;
        return {
            courseCount,
            selectedCount: selectedConfigurations.length,
            conflictCount: conflicts.length,
            period: parsedSchedule?.studentInfo.period ?? "2026 - 1",
        };
    }, [conflicts.length, parsedSchedule, selectedConfigurations.length]);

    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
                {/* ── Confirm-clear modal ──────────────────────────────── */}
                {showConfirmClear && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-clear-title"
                        aria-describedby="confirm-clear-desc"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-text)_40%,transparent)] px-4"
                    >
                        <div className="w-full max-w-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 shadow-xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-danger)]">
                                Acción destructiva
                            </p>
                            <h2
                                id="confirm-clear-title"
                                className="mt-3 font-heading text-3xl text-[var(--color-text)]"
                            >
                                ¿Borrar el horario actual?
                            </h2>
                            <p
                                id="confirm-clear-desc"
                                className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]"
                            >
                                Tienes {selectedConfigurations.length}{" "}
                                configuraci
                                {selectedConfigurations.length === 1
                                    ? "ón de curso seleccionada"
                                    : "ones de curso seleccionadas"}{" "}
                                . Si subes un PDF nuevo, se borrarán todas y no
                                podrás deshacer esta acción.
                            </p>
                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancelClear}
                                    className="border border-[var(--color-border-strong)] bg-[var(--color-page)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                                >
                                    Mantener mi horario
                                </button>
                                <button
                                    ref={confirmClearRef}
                                    type="button"
                                    onClick={handleConfirmClear}
                                    className="border border-[var(--color-danger)] bg-[var(--color-danger)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2"
                                >
                                    Sí, borrar y subir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Decorative background layers ─────────────────────── */}
                <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,var(--color-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-grid)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
                <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_55%)]" />

                {/* ── Header ───────────────────────────────────────────── */}
                <header className="sticky top-0 z-20 border-b border-[var(--color-border-strong)] bg-[color-mix(in_srgb,var(--color-surface)_88%,white)] backdrop-blur-sm">
                    {/*
                     * The header inner wrapper reuses --space-page-x for
                     * horizontal padding so it stays in perfect column
                     * alignment with the <main> PageContainer below.
                     */}
                    <div
                        className="mx-auto flex w-full max-w-[1920px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
                        style={{
                            paddingLeft: "var(--space-page-x)",
                            paddingRight: "var(--space-page-x)",
                            paddingTop: "1rem",
                            paddingBottom: "1rem",
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center border border-[var(--color-border-strong)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_16%,white),var(--color-surface))] text-[var(--color-primary)] shadow-[0_10px_30px_rgba(37,99,235,0.14)]">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                                    Planifica tu horario
                                </p>
                                <p className="mt-1 font-heading text-[clamp(1.5rem,2vw,2.1rem)] leading-none tracking-tight text-[var(--color-text)]">
                                    Organiza tu horario UTEC
                                </p>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-[15px]">
                                    Compara secciones, revisa cruces al toque y
                                    arma un horario más claro a partir del PDF
                                    oficial de matrícula de UTEC.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-stretch gap-2 sm:justify-end text-sm text-[var(--color-text-muted)]">
                            <MetaChip label="Periodo" value={overview.period} />
                            {parsedSchedule && !showUpload ? (
                                <>
                                    <MetaChip
                                        label="Estudiante"
                                        value={parsedSchedule.studentInfo.name}
                                    />
                                    <MetaChip
                                        label="Carrera"
                                        value={
                                            parsedSchedule.studentInfo.career
                                        }
                                    />
                                </>
                            ) : (
                                <MetaChip
                                    label="Modo"
                                    value="Planificador en escritorio"
                                />
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Main ─────────────────────────────────────────────── */}
                <main className="relative">
                    <PageContainer>
                        <SectionStack>
                            {shouldShowUpload ? (
                                /* ── Upload / landing screen ── */
                                <div
                                    className="grid xl:grid-cols-[1.15fr_0.85fr]"
                                    style={{ gap: "var(--space-gap)" }}
                                >
                                    {/* Hero panel */}
                                    <Panel as="section">
                                        <div className="max-w-3xl">
                                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                                                Arma tu horario
                                            </p>
                                            <h1 className="mt-4 max-w-4xl font-heading text-5xl leading-[0.92] tracking-tight text-[var(--color-text)] lg:text-7xl">
                                                Pasa tu PDF de matrícula a un
                                                horario fácil de revisar,
                                                comparar y ordenar.
                                            </h1>
                                            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
                                                Sube tu hoja de matrícula,
                                                revisa las opciones de
                                                secciones, detecta cruces desde
                                                el inicio y quédate con las
                                                combinaciones que realmente te
                                                sirven.
                                            </p>
                                        </div>

                                        <div
                                            className="mt-10 grid md:grid-cols-3"
                                            style={{ gap: "var(--space-gap)" }}
                                        >
                                            <LandingFeature
                                                icon={FileUp}
                                                title="Carga el PDF"
                                                description="Primero se ordena el contenido del PDF para que los cursos y sus filas se puedan leer mejor."
                                            />
                                            <LandingFeature
                                                icon={BookOpen}
                                                title="Elige bien tus secciones"
                                                description="Selecciona combinaciones completas de curso, no horarios sueltos que luego no te sirven al matricularte."
                                            />
                                            <LandingFeature
                                                icon={CalendarRange}
                                                title="Revísalo en calendario"
                                                description="Mira tus elecciones por día y hora, con colores claros y el nombre del docente en cada grupo."
                                            />
                                        </div>
                                    </Panel>

                                    {/* Upload panel */}
                                    <Panel as="section" noPadding>
                                        <PanelHeader className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                                                    Sube tu PDF
                                                </p>
                                                <h2 className="mt-2 font-heading text-3xl text-[var(--color-text)]">
                                                    Carga tu horario de
                                                    matrícula.
                                                </h2>
                                            </div>
                                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border border-[var(--color-border-strong)] bg-[var(--color-page)] text-[var(--color-primary)]">
                                                <ScanSearch className="h-5 w-5" />
                                            </div>
                                        </PanelHeader>

                                        <PanelBody>
                                            <PDFUploader
                                                onUploadSuccess={
                                                    handleUploadSuccess
                                                }
                                            />

                                            <div
                                                className="mt-6 grid border-t border-[var(--color-border)] pt-5"
                                                style={{
                                                    gap: "var(--space-gap)",
                                                }}
                                            >
                                                <ProcessRow
                                                    step="01"
                                                    title="Sube"
                                                    description="Carga el PDF oficial de UTEC."
                                                />
                                                <ProcessRow
                                                    step="02"
                                                    title="Revisa"
                                                    description="Mira las opciones agrupadas con docentes, aulas y horarios."
                                                />
                                                <ProcessRow
                                                    step="03"
                                                    title="Elige"
                                                    description="Quédate con las combinaciones que sí encajan en tu semana."
                                                />
                                            </div>
                                        </PanelBody>
                                    </Panel>
                                </div>
                            ) : (
                                /* ── Planning desk ── */
                                <>
                                    {/* Top bar: title card + stat cards */}
                                    <div
                                        className="grid lg:grid-cols-[1.35fr_0.65fr]"
                                        style={{ gap: "var(--space-gap)" }}
                                    >
                                        <Panel>
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                                                        Tu horario
                                                    </p>
                                                    <h2 className="mt-3 font-heading text-4xl leading-tight text-[var(--color-text)]">
                                                        {
                                                            parsedSchedule
                                                                ?.studentInfo
                                                                .career
                                                        }
                                                        <br />
                                                        <span className="text-[var(--color-text-muted)]">
                                                            organiza tu semana
                                                        </span>
                                                    </h2>
                                                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-muted)]">
                                                        Elige secciones, mira
                                                        cómo quedan durante la
                                                        semana y revisa bien los
                                                        cruces antes de cerrar
                                                        tu matrícula.
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleNewUpload}
                                                    className="inline-flex items-center gap-2 self-start border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--color-accent-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                                                >
                                                    Subir nuevo PDF
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </Panel>

                                        <div className="grid gap-[var(--space-gap)] sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                                            <StatCard
                                                icon={BookOpen}
                                                label="Cursos cargados"
                                                value={String(
                                                    overview.courseCount,
                                                )}
                                                accent="text-[var(--color-primary)]"
                                            />
                                            <StatCard
                                                icon={LayoutPanelTop}
                                                label="Selecciones"
                                                value={String(
                                                    overview.selectedCount,
                                                )}
                                                accent="text-[var(--color-accent)]"
                                            />
                                            <StatCard
                                                icon={ShieldAlert}
                                                label="Cruces"
                                                value={String(
                                                    overview.conflictCount,
                                                )}
                                                accent={
                                                    overview.conflictCount > 0
                                                        ? "text-[var(--color-danger)]"
                                                        : "text-[var(--color-success)]"
                                                }
                                                urgent={
                                                    overview.conflictCount > 0
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Two-column work area */}
                                    <div className="grid grid-cols-1 gap-[var(--space-gap)] lg:grid-cols-[minmax(340px,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(380px,440px)_minmax(0,1fr)] min-[1800px]:grid-cols-[minmax(400px,460px)_minmax(0,1fr)]">
                                        {/* Selection library */}
                                        <Panel
                                            as="section"
                                            noPadding
                                            className="min-w-0 lg:max-h-[calc(100dvh-var(--header-height)-var(--space-page-y)*2)] lg:overflow-hidden lg:flex lg:flex-col"
                                        >
                                            <PanelHeader className="shrink-0">
                                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                                                    Elige tus cursos
                                                </p>
                                                <h3 className="mt-2 font-heading text-2xl text-[var(--color-text)]">
                                                    Cursos y secciones
                                                </h3>
                                                <p className="mt-2 max-w-[38ch] text-sm leading-7 text-[var(--color-text-muted)]">
                                                    Filtra los cursos, compara
                                                    sus secciones y elige la
                                                    opción que mejor te acomode.
                                                </p>
                                            </PanelHeader>
                                            <PanelBody className="min-h-0 lg:flex-1 lg:overflow-y-auto">
                                                <CourseBrowser />
                                            </PanelBody>
                                        </Panel>

                                        {/* Calendar + export stack */}
                                        <div
                                            className="min-w-0 flex flex-col"
                                            style={{ gap: "var(--space-gap)" }}
                                        >
                                            <Panel as="section" noPadding>
                                                <PanelHeader className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                                                            Vista semanal
                                                        </p>
                                                        <h3 className="mt-2 font-heading text-2xl text-[var(--color-text)]">
                                                            Así queda tu horario
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-[var(--color-text-muted)]">
                                                        {
                                                            selectedConfigurations.length
                                                        }{" "}
                                                        curso
                                                        {selectedConfigurations.length ===
                                                        1
                                                            ? " seleccionado"
                                                            : "s seleccionados"}
                                                    </p>
                                                </PanelHeader>
                                                <PanelBody>
                                                    <ScheduleView />
                                                </PanelBody>
                                            </Panel>

                                            <Panel as="section">
                                                <div className="mb-4 flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                                                            Exporta tu horario
                                                        </p>
                                                        <h3 className="mt-2 font-heading text-2xl text-[var(--color-text)]">
                                                            Guarda las opciones
                                                            que quieras revisar
                                                            después
                                                        </h3>
                                                    </div>
                                                </div>
                                                <ExportPanel />
                                            </Panel>
                                        </div>
                                    </div>
                                </>
                            )}
                        </SectionStack>
                    </PageContainer>
                </main>
            </div>
        </QueryClientProvider>
    );
}

/* ── Small reusable sub-components ──────────────────────────────────────── */

function MetaChip({ label, value }: { label: string; value: string }) {
    return (
        <div className="inline-flex min-h-[44px] items-center gap-2.5 border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 font-sans shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                {label}
            </span>
            <span className="max-w-[28ch] truncate text-sm font-medium leading-none text-[var(--color-text)]">
                {value}
            </span>
        </div>
    );
}

function LandingFeature({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof BookOpen;
    title: string;
    description: string;
}) {
    return (
        <div
            className="border border-[var(--color-border-strong)] bg-[var(--color-page)]"
            style={{ padding: "var(--space-section)" }}
        >
            <Icon
                className="h-6 w-6 text-[var(--color-primary)]"
                aria-hidden="true"
            />
            <h3 className="mt-4 font-heading text-2xl text-[var(--color-text)]">
                {title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                {description}
            </p>
        </div>
    );
}

function ProcessRow({
    step,
    title,
    description,
}: {
    step: string;
    title: string;
    description: string;
}) {
    return (
        <div
            className="grid grid-cols-[56px_1fr] border border-[var(--color-border)] bg-[var(--color-page)]"
            style={{
                gap: "var(--space-section)",
                padding: "var(--space-section)",
            }}
        >
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--color-border-strong)] bg-[var(--color-surface)] font-heading text-xl text-[var(--color-primary)]">
                {step}
            </div>
            <div>
                <p className="font-medium text-[var(--color-text)]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                    {description}
                </p>
            </div>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
    urgent = false,
}: {
    icon: typeof BookOpen;
    label: string;
    value: string;
    accent: string;
    urgent?: boolean;
}) {
    return (
        <div
            className={`border bg-[var(--color-surface)] ${urgent ? "border-[var(--color-danger)]" : "border-[var(--color-border-strong)]"}`}
            role="status"
            aria-label={`${label}: ${value}`}
            style={{ padding: "var(--space-section)" }}
        >
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    {label}
                </span>
                <Icon className={`h-5 w-5 ${accent}`} aria-hidden="true" />
            </div>
            <div className="mt-5 font-heading text-4xl leading-none text-[var(--color-text)]">
                {value}
            </div>
        </div>
    );
}

export default App;
