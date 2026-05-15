import Navbar from './Navbar';
import Footer from './Footer';

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
