export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span className="logo-icon" style={{ width: size, height: size }}>
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 12 19 5" />
        <path d="M12 4a8 8 0 1 1-8 8" strokeOpacity="0.65" />
      </svg>
    </span>
  );
}
