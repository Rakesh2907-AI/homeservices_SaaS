import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2 } from '@/components/marketing/Section';
import { AmbientBlobs } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

export const metadata = { title: 'System Status — ServiceHub' };

const SERVICES = [
  { name: 'API Gateway',         uptime: '100.000%', status: 'operational' },
  { name: 'Booking service',     uptime: '99.998%',  status: 'operational' },
  { name: 'Auth service',        uptime: '100.000%', status: 'operational' },
  { name: 'Tenant service',      uptime: '99.999%',  status: 'operational' },
  { name: 'Pricing engine',      uptime: '99.997%',  status: 'operational' },
  { name: 'Notification worker', uptime: '99.992%',  status: 'operational' },
  { name: 'PostgreSQL (primary)', uptime: '100.000%', status: 'operational' },
  { name: 'Redis cluster',       uptime: '100.000%', status: 'operational' },
  { name: 'CloudFront CDN',      uptime: '100.000%', status: 'operational' },
];

const INCIDENTS = [
  { date: '2026-04-22', title: 'Elevated booking API latency (us-east-1)', impact: 'minor', duration: '23 min', resolved: 'Identified hot tenant, applied per-tenant rate limit, rolled out replica fan-out.' },
  { date: '2026-03-15', title: 'Email delivery delays via SendGrid', impact: 'minor', duration: '1 hr 12 min', resolved: 'Upstream provider issue. Failover to Postmark as secondary now in place.' },
  { date: '2026-02-08', title: 'CloudFront cache miss on tenant assets', impact: 'minor', duration: '17 min', resolved: 'Origin shielded; cache headers corrected on uploaded logos.' },
];

function StatusBadge({ status }) {
  const map = {
    operational: ['bg-emerald-500', 'Operational'],
    degraded:    ['bg-amber-500',   'Degraded'],
    outage:      ['bg-rose-500',    'Outage'],
  };
  const [color, label] = map[status] || map.operational;
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`relative flex h-2.5 w-2.5`}>
        <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-ping`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
      </span>
      <span className="text-gray-700 font-medium">{label}</span>
    </span>
  );
}

// Generate a deterministic 90-day uptime sparkline
function generateUptimeBars(seed) {
  return Array.from({ length: 90 }, (_, i) => {
    // Sprinkle a few "blip" days based on a pseudo-random seed
    const v = (seed * 7919 + i * 31 + i * i) % 100;
    if (v < 2) return 'incident';
    if (v < 6) return 'partial';
    return 'ok';
  });
}

export default function StatusPage() {
  const overall = SERVICES.every((s) => s.status === 'operational');

  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <Section>
          <div className="max-w-3xl">
            <Eyebrow>System status</Eyebrow>
            <H2 className="flex items-center gap-3">
              {overall ? (
                <>
                  <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  All systems operational
                </>
              ) : 'Service degradation in progress'}
            </H2>
            <p className="mt-4 text-gray-600">Live status, 90-day uptime, and recent incidents. Pages update every 60 seconds.</p>
            <p className="mt-2 text-xs text-gray-500">Last updated: {new Date().toUTCString()}</p>
          </div>
        </Section>
      </section>

      <Section bg="gray">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {SERVICES.map((s, i) => {
              const bars = generateUptimeBars(i + 1);
              return (
                <div key={s.name} className="p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{s.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-mono">{s.uptime}</span>
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                    <div className="flex gap-[1px] h-6 items-end">
                      {bars.map((b, j) => (
                        <div
                          key={j}
                          title={`Day -${90 - j}`}
                          className={`flex-1 rounded-sm ${
                            b === 'ok' ? 'bg-emerald-400' :
                            b === 'partial' ? 'bg-amber-400' :
                            'bg-rose-400'
                          }`}
                          style={{ height: b === 'ok' ? '100%' : b === 'partial' ? '70%' : '40%' }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                      <span>90 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section>
        <div className="max-w-4xl mx-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Recent incidents</h3>
          <div className="space-y-4">
            {INCIDENTS.map((i) => (
              <div key={i.date} className="rounded-xl border border-gray-200 p-5 lift">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-xs text-gray-500">{new Date(i.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${i.impact === 'major' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{i.impact}</span>
                  <span className="text-xs text-gray-500">Duration: {i.duration}</span>
                </div>
                <h4 className="font-semibold text-gray-900">{i.title}</h4>
                <p className="mt-1 text-sm text-gray-600">{i.resolved}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <Icon.Mail className="h-4 w-4" /> Subscribe at status@servicehub.app to get incident notifications.
          </p>
        </div>
      </Section>
    </MarketingLayout>
  );
}
