import { AdminSidebar } from "./components/AdminSidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="pl-64">
        <div className="max-w-7xl mx-auto py-10 px-10">
          {children}
        </div>
      </div>
    </div>
  );
}