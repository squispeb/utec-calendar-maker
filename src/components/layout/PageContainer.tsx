import type { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

/**
 * PageContainer
 *
 * The single source of truth for horizontal page padding and max-width
 * centering. Every page-level section sits inside this wrapper so the
 * left/right breathing room is defined exactly once.
 *
 * Padding derives from --space-page-x / --space-page-y CSS tokens so it
 * scales automatically at each breakpoint without duplicating Tailwind
 * classes across every consumer.
 */
export function PageContainer({
    children,
    className = "",
}: PageContainerProps) {
    return (
        <div
            className={`relative mx-auto w-full max-w-[var(--layout-max-width)] ${className}`}
            style={{
                paddingLeft: "var(--space-page-x)",
                paddingRight: "var(--space-page-x)",
                paddingTop: "var(--space-page-y)",
                paddingBottom: "var(--space-page-y)",
            }}
        >
            {children}
        </div>
    );
}
