export function Logo({ className }: { className?: string }) {
  return (
    <a
      className={`logo${className ? ` ${className}` : ""}`}
      href="#/"
      aria-label="StaleGuard home"
    >
      <svg
        className="logo-mark"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 12h8M12 8v8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
      <span className="logo-text">StaleGuard</span>
    </a>
  );
}
