export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-foreground ${className}`}>
      <div
        className="flex h-5 w-5 items-center justify-center rounded-sm bg-foreground text-background"
        aria-hidden="true"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2" y="2" width="20" height="20" rx="4" transform="rotate(45 12 12)" />
        </svg>
      </div>
      <span className="font-bold text-sm tracking-tight">dopeshot</span>
    </div>
  );
}
