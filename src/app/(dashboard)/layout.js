import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }) {
  // In production, get user from session
  const user = { display_name: 'Admin', role: 'admin' };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
