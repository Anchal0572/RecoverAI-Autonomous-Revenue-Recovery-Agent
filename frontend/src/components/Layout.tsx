import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname) || 
                       location.pathname.startsWith('/demo-');
  let token = localStorage.getItem('token');

  useEffect(() => {
    // If no token exists, provide demo token for immediate dashboard exploration
    if (!token && !['/login', '/register'].includes(location.pathname)) {
      const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOWJkZjIyOGM5NTliYWEyZjViOGYxNiIsImVtYWlsIjoiYWRtaW5AY29tcGFueS5jb20iLCJyb2xlIjoiQWRtaW4iLCJtZXJjaGFudElkIjoiNmE5YmRmMjI4Yzk1OWJhYTJmNWI4ZjEyIiwiaWF0IjoxNzg4NjAwMDk4LCJleHAiOjE3ODg2ODY0OTh9.sPj1y29Wv5m-BNNtRdjSQ7U8oZALKehb0jHbOc8b2PQ';
      localStorage.setItem('token', demoToken);
    }
  }, [isPublicPage, token, location.pathname]);

  if (isPublicPage) {
    return (
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    );
  }

  const activeToken = token || localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOWJkZjIyOGM5NTliYWEyZjViOGYxNiIsImVtYWlsIjoiYWRtaW5AY29tcGFueS5jb20iLCJyb2xlIjoiQWRtaW4iLCJtZXJjaGFudElkIjoiNmE5YmRmMjI4Yzk1OWJhYTJmNWI4ZjEyIiwiaWF0IjoxNzg4NjAwMDk4LCJleHAiOjE3ODg2ODY0OTh9.sPj1y29Wv5m-BNNtRdjSQ7U8oZALKehb0jHbOc8b2PQ';

  if (!activeToken && !isPublicPage) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <Topbar />
        <div className="p-8 flex-1 animate-in fade-in duration-500">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
