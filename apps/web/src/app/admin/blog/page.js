'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Card, CardHeader, Badge, EmptyState, StatusDot,
  Table, THead, TBody, TR, TH, TD, Skeleton,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const CATEGORIES = ['Engineering', 'Operations', 'Business', 'Customer stories'];

export default function BlogAdminPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/blog-posts')
      .then((r) => { setPosts(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []);

  async function save(form) {
    try {
      const payload = {
        ...form,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : form.tags,
        published_at: form.is_published && !form.published_at ? new Date().toISOString() : form.published_at,
      };
      if (payload.id) await adminFetch(`/api/v1/admin/blog-posts/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/api/v1/admin/blog-posts', { method: 'POST', body: JSON.stringify(payload) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this blog post?')) return;
    try { await adminFetch(`/api/v1/admin/blog-posts/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Content"
          title="Blog"
          description="Marketing-site blog content. Markdown is supported in the body; the marketing site renders posts at /blog/<slug>."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Content' }, { label: 'Blog' }]}
          actions={
            <Button onClick={() => setEditing({ slug: '', title: '', excerpt: '', body: '', author: '', author_role: '', category: 'Engineering', tags: [], read_time: '5 min read', is_published: false })} variant="primary" size="sm">
              <Icon.Newspaper className="h-3.5 w-3.5" /> New post
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <BlogEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {loading ? (
        <Table>
          <THead><TH>Post</TH><TH>Author</TH><TH>Category</TH><TH>Published</TH><TH>Status</TH><TH /></THead>
          <TBody>{[1,2,3,4].map((i) => (<TR key={i} hover={false}>{[1,2,3,4,5,6].map((c) => <TD key={c}><Skeleton height={14} className="w-24" /></TD>)}</TR>))}</TBody>
        </Table>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Icon.Newspaper}
          title="No posts yet"
          description="Write your first marketing-site blog post — it'll appear at /blog on the public site."
          action={<Button onClick={() => setEditing({ slug: '', title: '', body: '', category: 'Engineering', tags: [], is_published: false })} variant="primary" size="sm">Write first post</Button>}
        />
      ) : (
        <Table>
          <THead>
            <TH>Post</TH>
            <TH>Author</TH>
            <TH>Category</TH>
            <TH>Published</TH>
            <TH>Status</TH>
            <TH />
          </THead>
          <TBody>
            {posts.map((p) => (
              <TR key={p.id}>
                <TD>
                  <div className="font-medium">{p.title}</div>
                  <code className="text-[10px] font-mono text-dim">/blog/{p.slug}</code>
                </TD>
                <TD>
                  <div className="text-sm">{p.author}</div>
                  <div className="text-xs text-dim">{p.author_role}</div>
                </TD>
                <TD><Badge variant="blue">{p.category}</Badge></TD>
                <TD className="text-xs text-muted mono-num">{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</TD>
                <TD><StatusDot color={p.is_published ? 'emerald' : 'gray'} label={p.is_published ? 'Published' : 'Draft'} /></TD>
                <TD align="right">
                  <div className="flex items-center justify-end gap-3 text-xs">
                    <button onClick={() => setEditing({ ...p, tags: (p.tags || []).join(', ') })} className="text-blue-600 hover:underline font-medium">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </AdminShell>
  );
}

function BlogEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({ ...initial, tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || '') });
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title={initial.id ? 'Edit post' : 'New post'} />
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Slug">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} />
          </Field>
          <Field label="Category">
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Title">
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="Excerpt">
          <textarea rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.excerpt || ''} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Author"><input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.author || ''} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} /></Field>
          <Field label="Author role"><input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.author_role || ''} onChange={(e) => setForm((f) => ({ ...f, author_role: e.target.value }))} /></Field>
          <Field label="Read time"><input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.read_time || ''} onChange={(e) => setForm((f) => ({ ...f, read_time: e.target.value }))} /></Field>
        </div>
        <Field label="Tags (comma separated)">
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        </Field>
        <Field label="Body (Markdown)">
          <textarea rows={12} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" required value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} /> Publish on marketing site
        </label>
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button type="submit" variant="primary" size="sm">Save</Button>
          <button type="button" onClick={onCancel} className="text-sm text-muted">Cancel</button>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-xs block">
      <span className="block mb-1 text-muted font-semibold uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
