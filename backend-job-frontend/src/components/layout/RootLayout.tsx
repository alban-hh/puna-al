import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
