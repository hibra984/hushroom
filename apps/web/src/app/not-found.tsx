export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-2 text-6xl font-bold">404</h1>
      <h2 className="mb-4 text-xl text-gray-600">Page Not Found</h2>
      <p className="mb-8 text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <a
        href="/"
        className="rounded-lg bg-gray-900 px-6 py-3 text-white transition hover:bg-gray-700"
      >
        Go Home
      </a>
    </div>
  );
}
