type MockChartProps = {
  label: string;
};

export function MockChart({ label }: MockChartProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <div className="h-2 w-10 rounded-full bg-sky-100" />
      </div>
      <div className="mt-4 grid grid-cols-12 items-end gap-1 h-28">
        <div className="col-span-2 h-10 rounded bg-neutral-100" />
        <div className="col-span-1 h-12 rounded bg-sky-200/70" />
        <div className="col-span-2 h-16 rounded bg-neutral-100" />
        <div className="col-span-1 h-20 rounded bg-indigo-200/70" />
        <div className="col-span-2 h-14 rounded bg-neutral-100" />
        <div className="col-span-1 h-24 rounded bg-emerald-200/70" />
        <div className="col-span-3 h-20 rounded bg-neutral-100" />
      </div>
    </div>
  );
}
