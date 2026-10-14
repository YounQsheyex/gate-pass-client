const styles: Record<string, string> = {
  pending: "bg-stub text-ink",
  paid: "bg-ok/15 text-ok",
  cancelled: "bg-bad/10 text-bad",
  expired: "bg-line text-ink-soft",
  draft: "bg-line text-ink-soft",
  published: "bg-ok/15 text-ok",
  valid: "bg-ok/15 text-ok",
  used: "bg-ink text-white",
  void: "bg-bad/10 text-bad",
};

const labels: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
  expired: "Expired",
  draft: "Draft",
  published: "On sale",
  valid: "Not used yet",
  used: "Checked in",
  void: "Void",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[status] ?? "bg-line"}`}>
      {labels[status] ?? status}
    </span>
  );
}
