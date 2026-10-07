/**
 * The running head of the leaf: where you are, what this page holds, and the
 * one action the page is for.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  marker,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Short right-aligned note in the running head, e.g. the open period. */
  marker?: string;
}) {
  return (
    <header className="rule-dense flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-3">
      <div className="min-w-0">
        <h1 className="text-title text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-[68ch] text-body text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {marker ? <span className="fig text-caption text-faint">{marker}</span> : null}
        {action}
      </div>
    </header>
  );
}
