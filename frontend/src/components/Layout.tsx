import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!isPublicPage && !token) {
      navigate('/login');
    }
  }, [isPublicPage, token, navigate]);

  if (isPublicPage) {
    return <Outlet />;
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <Topbar />
        <div className="p-8 flex-1 animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
