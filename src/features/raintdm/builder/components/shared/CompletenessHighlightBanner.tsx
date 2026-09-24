import type { BuildCompletenessIssue } from "../../utils/build-completeness.types";

interface CompletenessHighlightBannerProps {
  issues: BuildCompletenessIssue[];
  onIssueClick?: (issue: BuildCompletenessIssue) => void;
}

export function CompletenessHighlightBanner({
  issues,
  onIssueClick,
}: CompletenessHighlightBannerProps) {
  if (issues.length === 0) return null;

  return (
    <div className="mb-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5">
      <p className="mb-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
        Pending steps:
      </p>
      <ul className="space-y-0.5 text-[11px] text-amber-800 dark:text-amber-200">
        {issues.map((issue) => (
          <li key={issue.id}>
            {onIssueClick ? (
              <button
                type="button"
                className="text-left underline-offset-2 hover:underline"
                onClick={() => onIssueClick(issue)}
              >
                • {issue.message}
              </button>
            ) : (
              <>• {issue.message}</>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
