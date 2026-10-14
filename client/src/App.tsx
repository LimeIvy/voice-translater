import "./index.css";
import Mic from "./components/Mic";

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-8">
      <h1 className="text-3xl font-bold">voice-translater</h1>
      <Mic />
    </main>
  );
}

export default App;
