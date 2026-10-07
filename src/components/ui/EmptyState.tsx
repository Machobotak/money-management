export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="sheet flex flex-col items-start gap-2 py-10 pl-5 pr-5">
      <p className="text-lead text-ink">{title}</p>
      {description ? <p className="max-w-[52ch] text-body text-muted">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
