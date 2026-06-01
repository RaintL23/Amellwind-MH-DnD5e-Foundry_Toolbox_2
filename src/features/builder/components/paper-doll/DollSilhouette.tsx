export function DollSilhouette() {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
      <svg viewBox="0 0 100 140" className="h-full w-auto max-h-full">
        <ellipse cx="50" cy="20" rx="12" ry="14" fill="currentColor" />
        <rect x="35" y="34" width="30" height="50" rx="5" fill="currentColor" />
        <rect x="25" y="36" width="10" height="40" rx="4" fill="currentColor" />
        <rect x="65" y="36" width="10" height="40" rx="4" fill="currentColor" />
        <rect x="37" y="84" width="12" height="45" rx="4" fill="currentColor" />
        <rect x="51" y="84" width="12" height="45" rx="4" fill="currentColor" />
      </svg>
    </div>
  );
}
