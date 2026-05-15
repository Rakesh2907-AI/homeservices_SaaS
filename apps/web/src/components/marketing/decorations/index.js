/**
 * Decorative primitives for the marketing site. All pure CSS/SVG — no external
 * libraries, no extra JS bundle weight beyond what these files contribute.
 */

// ---------- Ambient gradient blobs (animated background ornaments) ----------
export function GradientBlob({ className = '', from = 'bg-blue-200', to = 'bg-cyan-200', size = 'h-72 w-72' }) {
  return (
    <div className={`pointer-events-none absolute ${size} rounded-full blur-3xl opacity-60 animate-float-slow ${className}`}>
      <div className={`absolute inset-0 rounded-full ${from} mix-blend-multiply animate-pulse-soft`} />
      <div className={`absolute inset-4 rounded-full ${to} mix-blend-multiply animate-pulse-soft`} style={{ animationDelay: '1s' }} />
    </div>
  );
}

// ---------- Ambient blobs container — drop-in for sections ----------
export function AmbientBlobs() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <GradientBlob className="-top-20 -right-20" from="bg-blue-200" to="bg-cyan-200" size="h-96 w-96" />
      <GradientBlob className="top-40 -left-32" from="bg-cyan-100" to="bg-blue-100" size="h-80 w-80" />
      <GradientBlob className="bottom-0 right-1/3" from="bg-indigo-100" to="bg-violet-100" size="h-72 w-72" />
    </div>
  );
}

// ---------- Dot-grid background overlay ----------
export function DotGrid({ className = '' }) {
  return <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 bg-dot-grid opacity-50 ${className}`} />;
}

export function LineGrid({ className = '' }) {
  return <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 bg-line-grid opacity-50 ${className}`} />;
}

// ---------- Decorative SVG mesh — adds depth in hero sections ----------
export function MeshGradient({ className = '' }) {
  return (
    <svg aria-hidden className={`pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-40 ${className}`} viewBox="0 0 1200 600" preserveAspectRatio="none">
      <defs>
        <radialGradient id="mg1" cx="20%" cy="30%" r="40%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mg2" cx="80%" cy="20%" r="40%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mg3" cx="60%" cy="90%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#mg1)" />
      <rect width="1200" height="600" fill="url(#mg2)" />
      <rect width="1200" height="600" fill="url(#mg3)" />
    </svg>
  );
}

// ---------- Floating decorative shapes ----------
export function FloatingShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg className="absolute top-20 right-10 h-16 w-16 text-blue-300 animate-float-medium" fill="currentColor" viewBox="0 0 100 100">
        <polygon points="50,5 95,85 5,85" />
      </svg>
      <svg className="absolute top-1/3 left-12 h-12 w-12 text-cyan-300 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" rx="12" />
      </svg>
      <svg className="absolute bottom-20 right-1/4 h-20 w-20 text-blue-200 animate-float-medium" style={{ animationDelay: '2s' }} fill="currentColor" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" />
      </svg>
      <svg className="absolute bottom-1/3 left-1/3 h-10 w-10 text-violet-300 animate-float-medium" style={{ animationDelay: '1s' }} fill="currentColor" viewBox="0 0 100 100">
        <path d="M50 0 L100 50 L50 100 L0 50 Z" />
      </svg>
    </div>
  );
}

// ---------- Logo marquee — infinite horizontal scroll ----------
export function Marquee({ items }) {
  // Duplicate items so the scroll is seamless.
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)' }}>
      <div className="flex w-max gap-16 animate-marquee items-center py-4">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-gray-500 font-semibold whitespace-nowrap text-base">
            {item.icon && <span className="text-2xl">{item.icon}</span>}
            <span>{item.name || item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Gradient feature icon (replaces emoji) ----------
export function FeatureIcon({ children, gradient = 'from-blue-500 to-cyan-500' }) {
  return (
    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-blue-500/20`}>
      {children}
    </div>
  );
}

// ---------- Browser mockup chrome ----------
export function BrowserMockup({ url = 'acme.servicehub.app', children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 ${className}`}>
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <div className="ml-4 flex-1 max-w-md">
          <div className="rounded-md bg-white border border-gray-200 px-3 py-1 text-xs text-gray-500 flex items-center gap-2">
            <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {url}
          </div>
        </div>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}
