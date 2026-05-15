import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section } from '@/components/marketing/Section';
import { Icon } from '@/components/marketing/icons';
import { getPost, getAllPosts } from '@/lib/blog-posts';

function coverFor(category) {
  const map = {
    Engineering: { gradient: 'from-blue-500 via-cyan-400 to-blue-600', Ico: Icon.Code },
    Operations:  { gradient: 'from-emerald-500 via-teal-400 to-cyan-500', Ico: Icon.Calendar },
    Business:    { gradient: 'from-amber-500 via-orange-400 to-rose-500', Ico: Icon.Dollar },
    'Customer stories': { gradient: 'from-violet-500 via-purple-400 to-pink-500', Ico: Icon.Star },
  };
  return map[category] || map.Engineering;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  return { title: `${post.title} — ServiceHub Blog`, description: post.excerpt };
}

/** Lightweight Markdown → HTML for our small blog needs. */
function renderBody(md) {
  const lines = md.trim().split('\n');
  const out = [];
  let inCode = false;
  let codeBuf = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCode) {
        out.push(<pre key={`c-${i}`} className="bg-gray-900 text-gray-100 rounded-lg p-5 my-6 overflow-x-auto text-sm font-mono whitespace-pre">{codeBuf.join('\n')}</pre>);
        codeBuf = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    if (line.startsWith('## ')) {
      out.push(<h2 key={i} className="text-2xl font-bold text-gray-900 mt-12 mb-4">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      out.push(<h1 key={i} className="text-3xl font-bold text-gray-900 mt-12 mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ')) {
      // collect consecutive list items
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      i -= 1;
      out.push(
        <ul key={i} className="list-disc pl-6 my-4 space-y-2 text-gray-700">
          {items.map((it, k) => <li key={k} dangerouslySetInnerHTML={{ __html: inlineMd(it) }} />)}
        </ul>
      );
    } else if (line.trim() === '') {
      // skip
    } else {
      out.push(<p key={i} className="text-gray-700 leading-relaxed my-4" dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />);
    }
  }
  return out;
}

function inlineMd(s) {
  return s
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export default function BlogPost({ params }) {
  const post = getPost(params.slug);
  if (!post) return notFound();

  const allPosts = getAllPosts();
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const cover = coverFor(post.category);

  return (
    <MarketingLayout>
      {/* HEADER */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 pt-16 pb-12">
          <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-block">← Back to blog</Link>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium">{post.category}</span>
            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">{post.title}</h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">{post.excerpt}</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
              {post.author.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="font-medium text-gray-900">{post.author}</div>
              <div className="text-sm text-gray-500">{post.authorRole}</div>
            </div>
          </div>
        </div>
      </section>

      {/* COVER */}
      <div className="max-w-4xl mx-auto px-6 -mt-2">
        <div className={`relative aspect-[16/8] rounded-2xl bg-gradient-to-br ${cover.gradient} flex items-center justify-center overflow-hidden`}>
          <div aria-hidden className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 h-32 w-32 rounded-full border-2 border-white" />
            <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full border-2 border-white" />
            <div className="absolute top-1/2 left-1/3 h-24 w-24 rotate-45 border-2 border-white" />
          </div>
          <cover.Ico className="relative h-32 w-32 text-white opacity-90" />
        </div>
      </div>

      {/* BODY */}
      <article className="max-w-3xl mx-auto px-6 py-16">
        {renderBody(post.body)}

        {/* TAGS */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span key={t} className="text-xs rounded-full border border-gray-300 px-3 py-1 text-gray-600">#{t}</span>
          ))}
        </div>
      </article>

      {/* RELATED */}
      <Section bg="gray">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Keep reading</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="rounded-xl bg-white border border-gray-200 p-6 hover:shadow-md transition">
              <div className="text-xs text-blue-600 font-medium mb-2">{p.category}</div>
              <h3 className="font-bold text-gray-900 mb-2 leading-snug">{p.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </Section>
    </MarketingLayout>
  );
}
