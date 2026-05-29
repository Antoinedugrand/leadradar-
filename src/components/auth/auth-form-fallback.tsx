export function AuthFormFallback() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="lr-card lr-card-pad-lg animate-pulse">
        <div className="mb-2 h-8 w-48 rounded bg-[var(--slate-200)]" />
        <div className="mb-6 h-4 w-full rounded bg-[var(--slate-100)]" />
        <div className="space-y-4">
          <div className="h-10 rounded bg-[var(--slate-100)]" />
          <div className="h-10 rounded bg-[var(--slate-100)]" />
          <div className="h-10 rounded bg-[var(--slate-200)]" />
        </div>
      </div>
    </div>
  );
}
