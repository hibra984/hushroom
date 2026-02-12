export default function SessionsPage() {
  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <a
          href="/sessions/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white transition hover:bg-gray-700"
        >
          Book New Session
        </a>
      </div>
      <p className="text-gray-500">
        Your session history and upcoming bookings will appear here.
      </p>
    </div>
  );
}
