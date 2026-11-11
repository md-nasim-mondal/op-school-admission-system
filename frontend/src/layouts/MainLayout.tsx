import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 min-[320px]:px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
