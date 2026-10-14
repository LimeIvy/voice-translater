import "./index.css";
import { useQuery } from "@tanstack/react-query";

type health = {
  status: string;
};

const apiURL = import.meta.env.VITE_API_URL;

function App() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await fetch(`${apiURL}/health`);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json() as Promise<health>;
    },
  });

  if (isLoading) return <p>読み込み中...</p>
  if (isError) return <p>エラー: {error.message}</p>
  
  console.log(data?.status);
  return (
    <div className="h-screen">
      <h1 className="flex items-center justify-center py-10 text-3xl font-bold text-gray-900">
        voice-translater
      </h1>
      <div className="flex items-center justify-center">
        {data?.status}
      </div>
    </div>
  );
}
export default App;
