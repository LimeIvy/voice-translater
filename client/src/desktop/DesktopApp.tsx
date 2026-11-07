import ModelManager from "./translation/ModelManager";

export default function WebApp() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-8">
      <h1 className="text-3xl font-bold">desktop-voice-translater</h1>
      <ModelManager /> 
    </main>
  );
}
