export default function ActiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-2xl font-bold">Active Session</h1>
      <p className="text-gray-400">
        The live session room will render here with video, audio, and presence
        indicators.
      </p>
    </div>
  );
}
