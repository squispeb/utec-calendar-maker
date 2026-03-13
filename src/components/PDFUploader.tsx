import { useCallback, useRef, useState } from "react";
import { FileText, ScanSearch, Upload, X } from "lucide-react";
import { useScheduleStore } from "../store/scheduleStore";
import type { ParsedSchedule } from "../types";

interface PDFUploaderProps {
    onUploadSuccess?: (data: ParsedSchedule) => void;
}

export function PDFUploader({ onUploadSuccess }: PDFUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setParsedSchedule = useScheduleStore(
        (state) => state.setParsedSchedule,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processPDF = useCallback(
        async (file: File) => {
            try {
                setError(null);

                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/parse-pdf", {
                    method: "POST",
                    body: formData,
                });

                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(
                        payload.error || "No pudimos procesar el PDF",
                    );
                }

                const data = payload.parsed as ParsedSchedule;

                if (payload.meta?.runner) {
                    console.info(`PDF processed with ${payload.meta.runner}`);
                }

                if (!data?.courses?.length) {
                    throw new Error(
                        "No encontramos cursos en el PDF que subiste",
                    );
                }

                setParsedSchedule(data);
                onUploadSuccess?.(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Hubo un problema al procesar el PDF",
                );
            }
        },
        [onUploadSuccess, setParsedSchedule],
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            setError(null);

            const file = e.dataTransfer.files[0];
            if (file && file.type === "application/pdf") {
                setIsLoading(true);
                await processPDF(file);
                setIsLoading(false);
            } else {
                setError("Sube un archivo en PDF para continuar");
            }
        },
        [processPDF],
    );

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsLoading(true);
            setError(null);
            await processPDF(file);
            setIsLoading(false);
            e.target.value = "";
        },
        [processPDF],
    );

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className="w-full space-y-4">
            <button
                type="button"
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                disabled={isLoading}
                aria-busy={isLoading}
                className={`w-full border-2 border-dashed px-6 py-10 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                    isDragging
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                        : "border-[var(--color-border-strong)] bg-[var(--color-page)] hover:border-[var(--color-primary)]"
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
                    <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary-soft)] border-t-[var(--color-primary)]" />
                        </div>
                        <div>
                            <p className="font-heading text-3xl leading-none text-[var(--color-text)]">
                                Estamos procesando tu PDF
                            </p>
                            <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                                Estamos leyendo el archivo, ordenando los cursos
                                y preparando las secciones para que puedas
                                revisarlas con más claridad.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-[84px_1fr] md:items-center">
                        <div className="flex h-20 w-20 items-center justify-center border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                            <Upload className="h-10 w-10" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="font-heading text-4xl leading-none text-[var(--color-text)]">
                                    Sube aquí tu PDF de matrícula
                                </p>
                                <span className="border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                                    PDF
                                </span>
                            </div>
                            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-text-muted)]">
                                Haz clic para buscar tu archivo o arrástralo
                                aquí. Usa la exportación oficial de `Horario
                                Carga Habil` para que podamos identificar
                                cursos, docentes, aulas y horarios
                                correctamente.
                            </p>
                        </div>
                    </div>
                )}
            </button>

            {error ? (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-start gap-3 border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-sm text-[var(--color-danger)]"
                >
                    <X className="mt-0.5 h-4 w-4" aria-hidden="true" />
                    <div>
                        <p className="font-semibold uppercase tracking-[0.12em]">
                            No se pudo cargar el archivo
                        </p>
                        <p className="mt-1 leading-6">{error}</p>
                    </div>
                </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
                <div className="border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-4">
                    <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                                Qué archivo subir
                            </p>
                            <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                                Sube el PDF de horario exportado desde la
                                plataforma de matrícula de UTEC. Lo ideal es que
                                incluya sección, grupo, frecuencia, aula y
                                docente.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-4">
                    <div className="flex items-start gap-3">
                        <ScanSearch className="mt-0.5 h-5 w-5 text-[var(--color-accent)]" />
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                                Cómo lo procesamos
                            </p>
                            <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                                El sistema conserva bien la estructura del PDF
                                para diferenciar cursos, grupos y docentes,
                                incluso cuando una fila viene partida en varias
                                líneas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
