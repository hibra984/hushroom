export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold">
        Hushroom
      </h1>
      <p className="mb-8 text-xl text-gray-600">
        Structured Human Presence Platform
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="rounded-lg bg-gray-900 px-6 py-3 text-white transition hover:bg-gray-700"
        >
          Sign In
        </a>
        <a
          href="/register"
          className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50"
        >
          Create Account
        </a>
      </div>
    </div>
  );
}
