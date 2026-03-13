import type { ReactNode } from "react";

interface SectionStackProps {
    children: ReactNode;
    className?: string;
}

/**
 * SectionStack
 *
 * Vertical rhythm container for the top-level sections on a page.
 * All children are stacked with a gap driven by --space-gap so every
 * view (upload screen, planning desk) breathes at the same interval.
 *
 * Use this as the direct child of PageContainer.
 */
export function SectionStack({ children, className = "" }: SectionStackProps) {
    return (
        <div
            className={`flex flex-col ${className}`}
            style={{ gap: "var(--space-gap)" }}
        >
            {children}
        </div>
    );
}
