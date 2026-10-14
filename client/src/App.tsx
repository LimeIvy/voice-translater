import "./index.css";

type health = {
  status: string;
};

function App() {

  const fetchHealth = async () => {
    const response = await fetch("http://100.66.183.124:8000/health");
    const data: health = await response.json();
    console.log(data);
  }

  return (
    <div className="h-screen">
      <h1 className="flex items-center justify-center py-10 text-3xl font-bold text-gray-900">voice-translater</h1>
      <div className="flex items-center justify-center">
        <button
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          onClick={fetchHealth}
        >
          Fetch Health
        </button>
      </div>
    </div>
  );
}
export default App;
