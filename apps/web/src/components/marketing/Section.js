export function Section({ children, className = '', bg = 'white' }) {
  return (
    <section className={`${bg === 'gray' ? 'bg-gray-50' : 'bg-white'} ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }) {
  return <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">{children}</p>;
}

export function H2({ children, className = '' }) {
  return <h2 className={`text-3xl md:text-4xl font-bold tracking-tight text-gray-900 ${className}`}>{children}</h2>;
}

export function Lead({ children }) {
  return <p className="mt-4 text-lg text-gray-600 max-w-2xl">{children}</p>;
}
