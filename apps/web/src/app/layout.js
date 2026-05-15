import './globals.css';

export const metadata = {
  title: 'Home Services SaaS',
  description: 'Multi-tenant home services platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
