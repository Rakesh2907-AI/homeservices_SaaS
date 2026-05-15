import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';
import { getAllPosts } from '@/lib/blog-posts';

// Map post categories → gradient + icon for visual variety
function coverFor(post) {
  const map = {
    Engineering: { gradient: 'from-blue-500 via-cyan-400 to-blue-600', Ico: Icon.Code },
    Operations:  { gradient: 'from-emerald-500 via-teal-400 to-cyan-500', Ico: Icon.Calendar },
    Business:    { gradient: 'from-amber-500 via-orange-400 to-rose-500', Ico: Icon.Dollar },
    'Customer stories': { gradient: 'from-violet-500 via-purple-400 to-pink-500', Ico: Icon.Star },
  };
  return map[post.category] || map.Engineering;
}

export const metadata = {
  title: 'Blog — ServiceHub',
  description: 'Engineering deep-dives, business playbooks, and customer stories.',
};

const CATEGORIES = ['All', 'Engineering', 'Operations', 'Business', 'Customer stories'];

export default function BlogIndex() {
  const posts = getAllPosts();
  const [hero, ...rest] = posts;
  const heroCover = coverFor(hero);

  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <DotGrid className="opacity-30" />
        <Section>
          <div className="max-w-3xl mb-4">
            <Eyebrow>Blog</Eyebrow>
            <H2>Notes from the team</H2>
            <Lead>Engineering deep-dives, business playbooks, and the lessons we&apos;ve learned running a multi-tenant SaaS.</Lead>
          </div>
        </Section>
      </section>

      {/* CATEGORY FILTER */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button key={c} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${c === 'All' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED POST */}
      <Section>
        <Link href={`/blog/${hero.slug}`} className="group block">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className={`relative aspect-[16/10] rounded-2xl bg-gradient-to-br ${heroCover.gradient} flex items-center justify-center overflow-hidden`}>
              {/* Decorative shapes */}
              <div aria-hidden className="absolute inset-0 opacity-20">
                <div className="absolute top-6 left-6 h-20 w-20 rounded-full border-2 border-white" />
                <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full border-2 border-white" />
                <div className="absolute top-1/2 left-1/3 h-16 w-16 rotate-45 border-2 border-white" />
              </div>
              <heroCover.Ico className="relative h-24 w-24 text-white opacity-90" />
            </div>
            <div>
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium">{hero.category}</span>
                <span>{new Date(hero.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span>·</span>
                <span>{hero.readTime}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition mb-4">{hero.title}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{hero.excerpt}</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                  {hero.author.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{hero.author}</div>
                  <div className="text-xs text-gray-500">{hero.authorRole}</div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </Section>

      {/* POST GRID */}
      <Section bg="gray">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((p) => {
            const cv = coverFor(p);
            return (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group rounded-xl bg-white border border-gray-200 overflow-hidden lift">
              <div className={`relative aspect-[16/10] bg-gradient-to-br ${cv.gradient} flex items-center justify-center overflow-hidden`}>
                <div aria-hidden className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 right-4 h-12 w-12 rounded-full border-2 border-white" />
                  <div className="absolute bottom-6 left-6 h-16 w-16 rotate-45 border-2 border-white" />
                </div>
                <cv.Ico className="relative h-16 w-16 text-white opacity-90 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 font-medium">{p.category}</span>
                  <span>{p.readTime}</span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition mb-2 leading-snug">{p.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{p.excerpt}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-600">{p.author}</span>
                  <span className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </Section>

      {/* NEWSLETTER */}
      <Section>
        <div className="rounded-2xl bg-gray-900 px-8 py-16 md:px-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Get our best posts in your inbox</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">One email per month. Engineering deep-dives, customer stories, and the occasional rant about service-business software. No spam, ever.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="you@example.com" className="flex-1 rounded-md px-4 py-3 text-gray-900 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="rounded-md bg-white text-gray-900 px-6 py-3 font-medium hover:bg-gray-100">Subscribe</button>
          </form>
        </div>
      </Section>
    </MarketingLayout>
  );
}
