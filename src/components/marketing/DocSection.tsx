import { ReactNode } from 'react';

type DocSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

export function DocSection({ id, title, children }: DocSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-black/10 bg-white p-8">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      <div className="mt-4 space-y-3 text-neutral-700 leading-relaxed">{children}</div>
    </section>
  );
}

