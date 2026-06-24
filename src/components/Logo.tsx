import { useId } from "react";

export function Logo({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <a
      className={`logo${className ? ` ${className}` : ""}`}
      href="#/"
      aria-label="StaleGuard home"
    >
      <svg
        className="logo-mark"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="var(--brand-bright)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <path
          d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"
          fill={`url(#${gradientId})`}
        />
      </svg>
      StaleGuard
    </a>
  );
}
