export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Hushroom</h1>
          <p className="text-sm text-gray-500">Structured Human Presence Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
