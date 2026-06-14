import type { BuildCompletenessIssue } from "../../utils/build-completeness.types";

interface CompletenessHighlightBannerProps {
  issues: BuildCompletenessIssue[];
}

export function CompletenessHighlightBanner({
  issues,
}: CompletenessHighlightBannerProps) {
  if (issues.length === 0) return null;

  return (
    <div className="mb-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5">
      <p className="mb-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
        Complete before exporting:
      </p>
      <ul className="space-y-0.5 text-[10px] text-amber-800 dark:text-amber-200">
        {issues.map((issue) => (
          <li key={issue.id}>• {issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
