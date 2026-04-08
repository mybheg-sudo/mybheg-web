import Sidebar from '@/components/layout/Sidebar';

import { headers } from 'next/headers';

export default async function DashboardLayout({ children }) {
  // In production, get user from session or JWT. For now, simulate via headers.
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || 1;
  const user = { id: parseInt(userId), display_name: `Admin (Tenant ${userId})`, role: 'admin' };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
