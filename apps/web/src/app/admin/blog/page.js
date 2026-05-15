'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const CATEGORIES = ['Engineering', 'Operations', 'Business', 'Customer stories'];

export default function BlogAdminPage() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/blog-posts').then((r) => setPosts(r.data)).catch((e) => setError(e.message));
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
      title="Blog posts"
      subtitle="Marketing-site blog content. Markdown supported in body."
      actions={
        <button onClick={() => setEditing({ slug: '', title: '', excerpt: '', body: '', author: '', author_role: '', category: 'Engineering', tags: [], read_time: '5 min read', is_published: false })} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">+ New post</button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <BlogEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3">Post</th>
              <th className="px-6 py-3">Author</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Published</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="font-medium">{p.title}</div>
                  <code className="text-[10px] font-mono text-gray-500">/blog/{p.slug}</code>
                </td>
                <td className="px-6 py-3"><div className="text-sm">{p.author}</div><div className="text-xs text-gray-500">{p.author_role}</div></td>
                <td className="px-6 py-3"><span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-medium">{p.category}</span></td>
                <td className="px-6 py-3 text-xs text-gray-500">{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3"><span className={`inline-flex items-center gap-1.5 text-xs ${p.is_published ? 'text-emerald-700' : 'text-gray-500'}`}><span className={`h-2 w-2 rounded-full ${p.is_published ? 'bg-emerald-500' : 'bg-gray-400'}`} />{p.is_published ? 'Published' : 'Draft'}</span></td>
                <td className="px-6 py-3 text-right space-x-3">
                  <button onClick={() => setEditing({ ...p, tags: (p.tags || []).join(', ') })} className="text-xs text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => remove(p.id)} className="text-xs text-rose-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">No posts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function BlogEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({ ...initial, tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || '') });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit post' : 'New post'}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" placeholder="slug" required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} />
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold mb-3" placeholder="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      <textarea rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3" placeholder="Excerpt" value={form.excerpt || ''} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Author name" value={form.author || ''} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Author role" value={form.author_role || ''} onChange={(e) => setForm((f) => ({ ...f, author_role: e.target.value }))} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Read time (e.g. 5 min)" value={form.read_time || ''} onChange={(e) => setForm((f) => ({ ...f, read_time: e.target.value }))} />
      </div>

      <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />

      <textarea rows={12} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono mb-3" placeholder="Body (Markdown)" required value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />

      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={!!form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />
        Publish to marketing site
      </label>

      <div className="flex items-center gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}
