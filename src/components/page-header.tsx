export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0b94bc]">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-[#0b1838] sm:text-[28px]">{title}</h1>
        <p className="mt-1.5 text-xs font-medium text-slate-500 sm:text-[13px]">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
