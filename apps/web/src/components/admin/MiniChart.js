/**
 * Tiny SVG area chart — no dependencies. Takes an array of { day, n } points.
 *
 * Renders a smooth area curve + the trailing point as a dot. Designed for
 * the overview tiles, so default size is compact.
 */
export default function MiniChart({ data, color = '#3b82f6', height = 60, showAxis = false, label }) {
  if (!data?.length) {
    return <div className="text-xs text-gray-400 italic">No data</div>;
  }

  const width = 300;
  const padding = 4;
  const maxN = Math.max(1, ...data.map((d) => d.n));

  const xStep = (width - padding * 2) / Math.max(1, data.length - 1);
  const yFor = (n) => height - padding - (n / maxN) * (height - padding * 2);

  // Build smooth curve using cubic bezier midpoints
  let dPath = '';
  for (let i = 0; i < data.length; i += 1) {
    const x = padding + i * xStep;
    const y = yFor(data[i].n);
    if (i === 0) dPath += `M ${x} ${y}`;
    else {
      const prevX = padding + (i - 1) * xStep;
      const prevY = yFor(data[i - 1].n);
      const cx = (prevX + x) / 2;
      dPath += ` C ${cx} ${prevY}, ${cx} ${y}, ${x} ${y}`;
    }
  }
  // Close into an area
  const areaPath = `${dPath} L ${padding + (data.length - 1) * xStep} ${height - padding} L ${padding} ${height - padding} Z`;
  const last = data[data.length - 1];
  const lastX = padding + (data.length - 1) * xStep;
  const lastY = yFor(last.n);
  const gradId = `chartgrad-${Math.round(Math.random() * 1e6)}`;

  return (
    <div className="w-full">
      {label && <div className="text-xs text-gray-500 mb-1">{label}</div>}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={dPath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lastX} cy={lastY} r="3" fill="white" stroke={color} strokeWidth="2" />
      </svg>
      {showAxis && (
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>{data[0].day}</span>
          <span>{data[data.length - 1].day}</span>
        </div>
      )}
    </div>
  );
}
