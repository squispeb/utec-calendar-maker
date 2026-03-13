import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    /** Remove internal padding — useful when the panel header and body
     *  need different padding or when the child manages its own spacing. */
    noPadding?: boolean;
    /** Render as a semantic <section> instead of a plain <div>. */
    as?: "div" | "section" | "article" | "aside";
}

/**
 * Panel
 *
 * The single visual surface card used throughout the app. Provides:
 *   - Consistent border + background treatment
 *   - Internal padding from --space-section so every panel breathes
 *     at the same rhythm at every breakpoint
 *   - An escape hatch (noPadding) for panels that split header/body
 *     sections internally (e.g. Selection Library, Weekly Board)
 *
 * Always use Panel instead of writing `border border-[var(--color-border-strong)]
 * bg-[var(--color-surface)] p-*` by hand. That way border colour, background,
 * and spacing can be updated globally in one place.
 */
export function Panel({
    children,
    className = "",
    style,
    noPadding = false,
    as: Tag = "div",
}: PanelProps) {
    const paddingStyle: CSSProperties = noPadding
        ? {}
        : { padding: "var(--space-section)" };
    return (
        <Tag
            className={`border border-[var(--color-border-strong)] bg-[var(--color-surface)] ${className}`}
            style={{ ...paddingStyle, ...style }}
        >
            {children}
        </Tag>
    );
}

/**
 * PanelHeader
 *
 * Standardised header strip for panels that have a labelled title row
 * separated from the body by a bottom border. Handles its own horizontal
 * padding so it aligns flush with the panel edge regardless of noPadding.
 */
interface PanelHeaderProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export function PanelHeader({
    children,
    className = "",
    style,
}: PanelHeaderProps) {
    return (
        <div
            className={`border-b border-[var(--color-border)] ${className}`}
            style={{
                paddingLeft: "var(--space-section)",
                paddingRight: "var(--space-section)",
                paddingTop: "calc(var(--space-section) * 0.75)",
                paddingBottom: "calc(var(--space-section) * 0.75)",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

/**
 * PanelBody
 *
 * Body region for panels that use PanelHeader. Gives the content area
 * the same section padding so text aligns with the header above it.
 */
interface PanelBodyProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export function PanelBody({ children, className = "", style }: PanelBodyProps) {
    return (
        <div
            className={className}
            style={{ padding: "var(--space-section)", ...style }}
        >
            {children}
        </div>
    );
}
