import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
    BookOpen,
    Check,
    ChevronDown,
    ChevronRight,
    Clock3,
    MapPin,
    ScanSearch,
    Users,
} from "lucide-react";
import { useScheduleStore } from "../store/scheduleStore";
import type {
    Course,
    CourseType,
    Modality,
    Section,
    SessionBundle,
} from "../types";
import { describeSession } from "../utils/conflictDetection";
import {
    deriveTeacherName,
    getRequiredBundleTypes,
    getSectionBundles,
} from "../utils/courseConfigurations";
import { Panel, PanelHeader, PanelBody } from "./layout";

export function CourseBrowser() {
    const courses = useScheduleStore((state) => state.getCourses());

    const [filterType, setFilterType] = useState<CourseType | "all">("all");
    const [filterModality, setFilterModality] = useState<Modality | "all">(
        "all",
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(
        null,
    );

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            const matchesType =
                filterType === "all" || course.type === filterType;
            const matchesModality =
                filterModality === "all" || course.modality === filterModality;
            const query = searchTerm.trim().toLowerCase();
            const matchesSearch =
                query.length === 0 ||
                course.name.toLowerCase().includes(query) ||
                course.code.toLowerCase().includes(query);

            return matchesType && matchesModality && matchesSearch;
        });
    }, [courses, filterModality, filterType, searchTerm]);

    const expandedCourse = useMemo(
        () =>
            filteredCourses.find((course) => course.id === expandedCourseId) ??
            null,
        [expandedCourseId, filteredCourses],
    );

    if (courses.length === 0) {
        return (
            <div className="border border-[var(--color-border)] bg-[var(--color-page)] px-6 py-12 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-[var(--color-text-subtle)]" />
                <p className="mt-4 font-heading text-3xl text-[var(--color-text)]">
                    Todavía no hay cursos cargados
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                    Sube primero un PDF para ver aquí tus cursos, secciones y
                    opciones por docente.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border border-[var(--color-border)] bg-[var(--color-page)]">
                <div
                    style={{
                        padding:
                            "calc(var(--space-section) * 0.65) var(--space-section)",
                    }}
                >
                    <div className="mb-3 flex items-center gap-2">
                        <ScanSearch
                            className="h-3.5 w-3.5 text-[var(--color-primary)]"
                            aria-hidden="true"
                        />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                            Busca y filtra
                        </span>
                    </div>

                    <div
                        className="grid xl:grid-cols-3"
                        style={{ gap: "var(--space-gap)" }}
                    >
                        <FilterField
                            label="Buscar curso"
                            htmlFor="search-filter"
                        >
                            <input
                                id="search-filter"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cloud Computing, CS2032…"
                                className="w-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
                            />
                        </FilterField>

                        <FilterField label="Tipo" htmlFor="type-filter">
                            <FilterSelect
                                id="type-filter"
                                value={filterType}
                                onChange={(e) =>
                                    setFilterType(
                                        e.target.value as CourseType | "all",
                                    )
                                }
                            >
                                <option value="all">Cualquier tipo</option>
                                <option value="Obligatorio">Obligatorio</option>
                                <option value="Electivo">Electivo</option>
                            </FilterSelect>
                        </FilterField>

                        <FilterField
                            label="Modalidad"
                            htmlFor="modality-filter"
                        >
                            <FilterSelect
                                id="modality-filter"
                                value={filterModality}
                                onChange={(e) =>
                                    setFilterModality(
                                        e.target.value as Modality | "all",
                                    )
                                }
                            >
                                <option value="all">Cualquier modalidad</option>
                                <option value="Presencial">Presencial</option>
                                <option value="Sincronico">Sincronico</option>
                                <option value="Virtual">Virtual</option>
                            </FilterSelect>
                        </FilterField>
                    </div>
                </div>
            </div>

            {expandedCourse ? (
                <div
                    className="sticky z-10 shrink-0 overflow-hidden border border-[color-mix(in_srgb,var(--color-border-strong)_90%,white)] bg-[color-mix(in_srgb,var(--color-surface)_96%,white)] shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur-sm"
                    style={{
                        top: "var(--space-gap)",
                        marginTop: "var(--space-gap)",
                        borderRadius: "calc(var(--radius-interactive) + 4px)",
                    }}
                >
                    <div
                        className="max-h-[calc(100dvh-var(--header-height)-var(--space-page-y)*2-4rem)] overflow-y-auto"
                        style={{ padding: "var(--space-section)" }}
                    >
                        <ExpandedCoursePanel
                            course={expandedCourse}
                            onCollapse={() => setExpandedCourseId(null)}
                        />
                    </div>
                </div>
            ) : null}

            <div
                className="min-h-0 flex-1 overflow-y-auto"
                style={{
                    marginTop: "var(--space-gap)",
                    paddingRight: "0.125rem",
                }}
            >
                {filteredCourses.length === 0 ? (
                    <div
                        className="border border-[var(--color-border)] bg-[var(--color-page)] py-10 text-center"
                        style={{ padding: "2.5rem var(--space-section)" }}
                    >
                        <p className="font-heading text-3xl text-[var(--color-text)]">
                            No encontramos cursos con esos filtros
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                            Prueba con otra búsqueda o abre más los filtros de
                            tipo y modalidad.
                        </p>
                    </div>
                ) : (
                    <div
                        className="flex flex-col"
                        style={{ gap: "calc(var(--space-gap) * 0.75)" }}
                    >
                        {filteredCourses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                expanded={expandedCourseId === course.id}
                                onToggle={() =>
                                    setExpandedCourseId((current) =>
                                        current === course.id
                                            ? null
                                            : course.id,
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterField({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col" style={{ gap: "0.35rem" }}>
            <label
                htmlFor={htmlFor}
                className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
            >
                {label}
            </label>
            {children}
        </div>
    );
}

function FilterSelect({
    id,
    value,
    onChange,
    children,
}: {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: ReactNode;
}) {
    return (
        <div className="relative">
            <select
                id={id}
                value={value}
                onChange={onChange}
                className="w-full cursor-pointer appearance-none border border-[color-mix(in_srgb,var(--color-border-strong)_92%,white)] bg-[color-mix(in_srgb,var(--color-surface)_96%,white)] py-2 pl-3 pr-9 text-sm text-[var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
            >
                {children}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-subtle)]"
                aria-hidden="true"
            />
        </div>
    );
}

function CourseCard({
    course,
    expanded,
    onToggle,
}: {
    course: Course;
    expanded: boolean;
    onToggle: () => void;
}) {
    const selectedConfiguration = useScheduleStore((state) =>
        state.selectedConfigurations.find(
            (item) => item.courseId === course.id,
        ),
    );

    return (
        <Panel
            noPadding
            className={
                expanded
                    ? "border-[var(--color-primary)] shadow-[0_10px_24px_rgba(37,99,235,0.10),inset_0_0_0_1px_var(--color-primary)]"
                    : "border-[color-mix(in_srgb,var(--color-border-strong)_88%,white)] shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
            }
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                className="flex w-full items-start justify-between gap-4 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-page)_82%,white)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
                style={{
                    paddingLeft: "var(--space-section)",
                    paddingRight: "var(--space-section)",
                    paddingTop: "calc(var(--space-section) * 0.9)",
                    paddingBottom: "calc(var(--space-section) * 0.9)",
                }}
            >
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                                course.type === "Obligatorio"
                                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                                    : "bg-[color-mix(in_srgb,var(--color-success)_14%,white)] text-[var(--color-success)]"
                            }`}
                        >
                            {course.type}
                        </span>
                        <span className="border border-[var(--color-border)] bg-[var(--color-page)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                            {course.modality}
                        </span>
                        {expanded ? (
                            <span className="border border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary-soft)_78%,white)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                                Viendo detalle
                            </span>
                        ) : null}
                    </div>
                    <h3
                        className="mt-3 max-w-none pr-2 font-heading text-[1.42rem] leading-[1.12] text-[var(--color-text)]"
                        title={course.name}
                    >
                        {course.name}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
                        <span className="font-medium text-[var(--color-text-muted)]">
                            {course.code}
                        </span>
                        {selectedConfiguration?.bundles?.length ? (
                            <span className="border border-[color-mix(in_srgb,var(--color-border-strong)_88%,white)] bg-[color-mix(in_srgb,var(--color-page)_78%,white)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                                {selectedConfiguration.bundles.length}/
                                {selectedConfiguration.requiredBundleTypes
                                    ?.length ??
                                    selectedConfiguration.bundles.length}{" "}
                                elegidos
                            </span>
                        ) : (
                            <span className="text-[var(--color-text-subtle)]">
                                Elige una opción de horario
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[color-mix(in_srgb,var(--color-border-strong)_88%,white)] bg-[color-mix(in_srgb,var(--color-page)_82%,white)] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                    <ChevronRight
                        className="h-5 w-5 transition-transform duration-200"
                        style={{
                            transform: expanded
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                        }}
                        aria-hidden="true"
                    />
                </div>
            </button>
        </Panel>
    );
}

function ExpandedCoursePanel({
    course,
    onCollapse,
}: {
    course: Course;
    onCollapse: () => void;
}) {
    const selectedConfiguration = useScheduleStore((state) =>
        state.selectedConfigurations.find(
            (item) => item.courseId === course.id,
        ),
    );
    const toggleBundleSelection = useScheduleStore(
        (state) => state.toggleBundleSelection,
    );

    return (
        <div
            className="course-panel-enter flex flex-col"
            style={{ gap: "var(--space-gap)" }}
        >
            <div className="sticky top-0 z-10 -mx-[var(--space-section)] border-b border-[color-mix(in_srgb,var(--color-border-strong)_90%,white)] bg-[color-mix(in_srgb,var(--color-surface)_90%,white)] px-[var(--space-section)] pb-4 pt-2 shadow-[0_16px_32px_rgba(15,23,42,0.12)] backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                    course.type === "Obligatorio"
                                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                                        : "bg-[color-mix(in_srgb,var(--color-success)_14%,white)] text-[var(--color-success)]"
                                }`}
                            >
                                {course.type}
                            </span>
                            <span className="border border-[var(--color-border)] bg-[var(--color-page)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                                {course.modality}
                            </span>
                            <span className="border border-[color-mix(in_srgb,var(--color-border-strong)_88%,white)] bg-[color-mix(in_srgb,var(--color-page)_55%,white)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                                {course.sections.length} sección
                                {course.sections.length === 1 ? "" : "es"}{" "}
                                disponibles
                            </span>
                        </div>
                        <h3 className="mt-3 font-heading text-[1.8rem] leading-[1.05] text-[var(--color-text)]">
                            {course.name}
                        </h3>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--color-text-muted)]">
                            <span className="font-medium text-[var(--color-text)]">
                                {course.code}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
                            <span>
                                {selectedConfiguration?.bundles?.length
                                    ? `${selectedConfiguration.bundles.length}/${selectedConfiguration.requiredBundleTypes?.length ?? selectedConfiguration.bundles.length} opciones elegidas`
                                    : "Todavía no eliges ninguna opción"}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCollapse}
                        className="shrink-0 border border-[var(--color-border-strong)] bg-[var(--color-page)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
                    >
                        Cerrar detalle
                    </button>
                </div>
            </div>

            <div className="flex flex-col" style={{ gap: "var(--space-gap)" }}>
                {course.sections.map((section) => {
                    const bundles = getSectionBundles(section);
                    const requiredTypes = getRequiredBundleTypes(section);
                    const isActiveSection =
                        selectedConfiguration?.sectionId === section.id;

                    return (
                        <SectionBuilder
                            key={`${course.id}-${section.id}`}
                            section={section}
                            bundles={bundles}
                            requiredTypes={requiredTypes}
                            activeBundleIds={
                                isActiveSection
                                    ? (selectedConfiguration?.bundles.map(
                                          (bundle) => bundle.id,
                                      ) ?? [])
                                    : []
                            }
                            onToggleBundle={(bundle) =>
                                toggleBundleSelection(course, section, bundle)
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}

interface SectionBuilderProps {
    section: Section;
    bundles: SessionBundle[];
    requiredTypes: string[];
    activeBundleIds: string[];
    onToggleBundle: (bundle: SessionBundle) => void;
}

function SectionBuilder({
    section,
    bundles,
    requiredTypes,
    activeBundleIds,
    onToggleBundle,
}: SectionBuilderProps) {
    return (
        <Panel
            noPadding
            className="overflow-hidden border-[color-mix(in_srgb,var(--color-border-strong)_88%,white)] shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
        >
            <PanelHeader className="bg-[color-mix(in_srgb,var(--color-surface)_88%,white)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                            Opción {section.id}
                        </p>
                        <p className="mt-2 max-w-none font-heading text-[1.5rem] leading-snug text-[var(--color-text)]">
                            {section.teacher}
                        </p>
                    </div>
                    <span className="shrink-0 border border-[color-mix(in_srgb,var(--color-border-strong)_88%,white)] bg-[color-mix(in_srgb,var(--color-page)_72%,white)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                        {activeBundleIds.length}/{requiredTypes.length} opciones
                        elegidas
                    </span>
                </div>
            </PanelHeader>

            <PanelBody
                className="flex flex-col bg-[color-mix(in_srgb,var(--color-page)_55%,white)]"
                style={{ gap: "var(--space-gap)" }}
            >
                {requiredTypes.map((type) => {
                    const typeBundles = bundles.filter(
                        (bundle) => bundle.type === type,
                    );

                    return (
                        <div
                            key={`${section.id}-${type}`}
                            className="border border-[color-mix(in_srgb,var(--color-border)_88%,white)] bg-[var(--color-surface)]"
                            style={{ padding: "var(--space-section)" }}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                                {type}
                            </p>
                            <div
                                className="mt-4 grid gap-3"
                                style={{
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(220px, 1fr))",
                                }}
                            >
                                {typeBundles.map((bundle) => {
                                    const isSelected = activeBundleIds.includes(
                                        bundle.id,
                                    );
                                    const displayTeacher =
                                        bundle.teacher &&
                                        bundle.teacher !== "Unknown"
                                            ? bundle.teacher
                                            : deriveTeacherName(
                                                  bundle.sessions,
                                              );

                                    return (
                                        <button
                                            key={bundle.id}
                                            type="button"
                                            onClick={() =>
                                                onToggleBundle(bundle)
                                            }
                                            aria-pressed={isSelected}
                                            aria-label={`${isSelected ? "Quitar" : "Elegir"} grupo ${bundle.group} — ${displayTeacher}`}
                                            className={`border text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 ${
                                                isSelected
                                                    ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary-soft)_72%,white)] shadow-[0_10px_24px_rgba(37,99,235,0.10),inset_4px_0_0_0_var(--color-primary),inset_0_0_0_1px_var(--color-primary)]"
                                                    : "border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,23,42,0.02)] hover:border-[var(--color-border-strong)] hover:bg-[color-mix(in_srgb,var(--color-page)_72%,white)] hover:shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
                                            }`}
                                            style={{
                                                padding:
                                                    "calc(var(--space-section) * 0.8)",
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="border border-[var(--color-border)] bg-[var(--color-page)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                                                            Grupo {bundle.group}
                                                        </span>
                                                        {isSelected ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                                                                <Check
                                                                    className="h-3.5 w-3.5 shrink-0"
                                                                    aria-hidden="true"
                                                                />
                                                                Elegido
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-3 max-w-none font-heading text-[1.4rem] leading-snug text-[var(--color-text)]">
                                                        {displayTeacher}
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                className="mt-4 flex flex-col"
                                                style={{
                                                    gap: "calc(var(--space-gap) * 0.45)",
                                                }}
                                            >
                                                {bundle.sessions.map(
                                                    (session) => (
                                                        <div
                                                            key={session.id}
                                                            className={`grid gap-2 border px-3 py-3 text-sm ${
                                                                isSelected
                                                                    ? "border-[color-mix(in_srgb,var(--color-primary)_18%,white)] bg-[var(--color-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                                                                    : "border-[color-mix(in_srgb,var(--color-border)_82%,white)] bg-[color-mix(in_srgb,var(--color-page)_72%,white)]"
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-2 text-[var(--color-text)]">
                                                                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                                                                <span className="leading-6">
                                                                    {describeSession(
                                                                        session,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                                                                <span className="inline-flex items-center gap-2">
                                                                    <MapPin className="h-3.5 w-3.5" />
                                                                    {session.location ||
                                                                        "Aula por confirmar"}
                                                                </span>
                                                                <span className="inline-flex items-center gap-2">
                                                                    <Users className="h-3.5 w-3.5" />
                                                                    {Math.max(
                                                                        session.vacancies -
                                                                            session.enrolled,
                                                                        0,
                                                                    )}{" "}
                                                                    cupos libres
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </PanelBody>
        </Panel>
    );
}
