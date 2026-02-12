export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <a href="/" className="text-lg font-bold">
            Hushroom
          </a>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </a>
            <a href="/sessions" className="text-sm text-gray-600 hover:text-gray-900">
              Sessions
            </a>
            <a href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              Profile
            </a>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-4">
        {children}
      </main>
    </div>
  );
}
