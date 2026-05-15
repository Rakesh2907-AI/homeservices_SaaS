/**
 * Admin route group layout — applies the .admin-app class so the design
 * tokens in globals.css scope only to admin pages (not marketing).
 */
export default function AdminLayout({ children }) {
  return <div className="admin-app">{children}</div>;
}
