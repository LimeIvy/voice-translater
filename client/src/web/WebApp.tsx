import Mic from "./stt/Mic";

export default function WebApp() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-8">
      <h1 className="text-3xl font-bold">voice-translater</h1>
      <Mic />
    </main>
  );
}
