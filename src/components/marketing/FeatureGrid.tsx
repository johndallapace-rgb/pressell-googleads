type Feature = {
  title: string;
  description: string;
};

type FeatureGridProps = {
  title: string;
  subtitle: string;
  features: Feature[];
};

export function FeatureGrid({ title, subtitle, features }: FeatureGridProps) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Platform</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">{title}</h2>
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">{subtitle}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-base font-semibold text-neutral-900">{f.title}</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

