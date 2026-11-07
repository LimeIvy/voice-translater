import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type ModelInfo = {
  id: string;
  name: string;
  downloaded: boolean;
  sizeBytes: number | null;
};

type Progress = {
  modelId: string;
  downloadedBytes: number;
  totalBytes: number | null;
};

type ServerStatus = "stopped" | "starting" | "ready" | "error";

const HEALTH_INTERVAL = 3000;
const HEALTH_TIMEOUT = 60000;
const HEALTH_RETRY_INTERVAL = 1000;

const statusConfig: Record<ServerStatus, { color: string; label: string }> = {
  stopped: {
    color: "bg-zinc-500",
    label: "停止中",
  },
  starting: {
    color: "bg-yellow-400 animate-pulse",
    label: "起動中...",
  },
  ready: {
    color: "bg-green-500 shadow-[0_0_8px_#22c55e]",
    label: "準備完了",
  },
  error: {
    color: "bg-red-500",
    label: "エラー",
  },
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function ModelManager() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [progress, setProgress] = useState<{
    modelId: string;
    percent: number;
  } | null>(null);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [serverStatus, setServerStatus] = useState<ServerStatus>("stopped");
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  // 非同期処理の競合・アンマウント後の更新を防ぐ
  const mountedRef = useRef(false);
  const operationRef = useRef(false);
  const generationRef = useRef(0);

  const refresh = useCallback(async () => {
    const result = await invoke<ModelInfo[]>("list_models");
    if (mountedRef.current) {
      setModels(result);
    }
    return result;
  }, []);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      return await invoke<boolean>("check_server_health");
    } catch {
      return false;
    }
  }, []);

  const waitForReady = useCallback(
    async (generation: number): Promise<boolean> => {
      const deadline = Date.now() + HEALTH_TIMEOUT;

      while (
        mountedRef.current &&
        generationRef.current === generation &&
        Date.now() < deadline
      ) {
        if (await checkHealth()) {
          return mountedRef.current && generationRef.current === generation;
        }

        await sleep(HEALTH_RETRY_INTERVAL);
      }

      return false;
    },
    [checkHealth],
  );

  const startServer = useCallback(
    async (modelId: string, modelName: string) => {
      if (operationRef.current) return;

      operationRef.current = true;
      const generation = ++generationRef.current;

      if (mountedRef.current) {
        setBusy(true);
        setServerStatus("starting");
        setMessage(`${modelName} を起動しています...`);
      }

      try {
        await invoke("start_server", { modelId });

        const ready = await waitForReady(generation);

        if (!mountedRef.current || generationRef.current !== generation) {
          return;
        }

        if (ready) {
          setServerStatus("ready");
          setActiveModelId(modelId);
          setMessage("");
        } else {
          setServerStatus("error");
          setActiveModelId(null);
          setMessage(
            "サーバーの準備が完了しませんでした。ログを確認してください。",
          );
        }
      } catch (error) {
        if (mountedRef.current && generationRef.current === generation) {
          setServerStatus("error");
          setActiveModelId(null);
          setMessage(`起動失敗: ${String(error)}`);
        }
      } finally {
        operationRef.current = false;

        if (mountedRef.current) {
          setBusy(false);
        }
      }
    },
    [waitForReady],
  );

  const stopServer = useCallback(async () => {
    if (operationRef.current) return;

    operationRef.current = true;
    ++generationRef.current;

    setBusy(true);
    setMessage("");

    try {
      await invoke("stop_server");

      if (mountedRef.current) {
        setServerStatus("stopped");
        setActiveModelId(null);
      }
    } catch (error) {
      if (mountedRef.current) {
        setServerStatus("error");
        setMessage(`停止失敗: ${String(error)}`);
      }
    } finally {
      operationRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }, []);

  const run = useCallback(
    async (action: () => Promise<void>) => {
      if (operationRef.current) return;

      operationRef.current = true;
      setBusy(true);
      setMessage("");

      try {
        await action();
        await refresh();
      } catch (error) {
        if (mountedRef.current) {
          setMessage(String(error));
        }
      } finally {
        operationRef.current = false;

        if (mountedRef.current) {
          setBusy(false);
        }
      }
    },
    [refresh],
  );

  // 初期化・前回モデルの自動起動
  useEffect(() => {
    mountedRef.current = true;
    let disposed = false;

    const initialize = async () => {
      try {
        const result = await invoke<ModelInfo[]>("list_models");

        if (disposed) return;
        setModels(result);

        const lastModel = await invoke<string | null>("get_last_model");

        if (disposed || !lastModel) return;

        const model = result.find((m) => m.id === lastModel && m.downloaded);

        if (!model) return;

        await startServer(model.id, model.name);
      } catch (error) {
        if (!disposed) {
          setMessage(`初期化失敗: ${String(error)}`);
        }
      }
    };

    void initialize();

    const listener = listen<Progress>("model-download-progress", (event) => {
      if (disposed) return;

      const { modelId, downloadedBytes, totalBytes } = event.payload;

      if (totalBytes && totalBytes > 0) {
        setProgress({
          modelId,
          percent: Math.min(
            100,
            Math.round((downloadedBytes / totalBytes) * 100),
          ),
        });
      }
    });

    return () => {
      disposed = true;
      mountedRef.current = false;
      ++generationRef.current;
      void listener.then((unlisten) => unlisten());
    };
  }, [startServer]);

  // 準備完了後も定期的にヘルスチェック
  useEffect(() => {
    if (serverStatus !== "ready") return;

    let disposed = false;
    let checking = false;

    const interval = setInterval(async () => {
      if (checking || disposed || operationRef.current) return;

      checking = true;

      try {
        const healthy = await checkHealth();

        if (!disposed && mountedRef.current && !healthy) {
          setServerStatus("error");
          setMessage("翻訳サーバーとの接続が切断されました。");
        }
      } finally {
        checking = false;
      }
    }, HEALTH_INTERVAL);

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [serverStatus, checkHealth]);

  const status = statusConfig[serverStatus];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">翻訳モデル</h2>

        <div
          className="flex items-center gap-2 text-xs text-zinc-400"
          role="status"
          aria-live="polite"
        >
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.color}`}
          />
          <span>{status.label}</span>
        </div>
      </div>

      {models.map((model) => {
        const isActive = activeModelId === model.id;
        const modelProgress =
          progress?.modelId === model.id ? progress.percent : null;

        return (
          <div
            key={model.id}
            className="space-y-3 rounded-lg border border-zinc-700 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{model.name}</div>

                <div className="mt-1 text-xs opacity-60">
                  {model.downloaded ? "ダウンロード済み" : "未ダウンロード"}
                </div>
              </div>

              {isActive && serverStatus === "ready" && (
                <span className="rounded bg-green-500/10 px-2 py-1 text-xs text-green-500">
                  使用中
                </span>
              )}
            </div>

            {modelProgress !== null && (
              <div className="space-y-1 text-xs">
                <div>ダウンロード: {modelProgress}%</div>
                <progress value={modelProgress} max={100} className="w-full" />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!model.downloaded && (
                <button
                  disabled={busy}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                  onClick={() =>
                    void run(async () => {
                      setProgress({
                        modelId: model.id,
                        percent: 0,
                      });

                      try {
                        await invoke("download_model", {
                          modelId: model.id,
                        });
                      } finally {
                        if (mountedRef.current) {
                          setProgress(null);
                        }
                      }
                    })
                  }
                >
                  ダウンロード
                </button>
              )}

              {model.downloaded && (
                <>
                  <button
                    disabled={
                      busy ||
                      serverStatus === "starting" ||
                      serverStatus === "ready"
                    }
                    className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                    onClick={() => void startServer(model.id, model.name)}
                  >
                    起動
                  </button>

                  <button
                    disabled={busy || serverStatus === "stopped"}
                    className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                    onClick={() => void stopServer()}
                  >
                    停止
                  </button>

                  <button
                    disabled={
                      busy ||
                      serverStatus === "starting" ||
                      serverStatus === "ready"
                    }
                    className="rounded border px-3 py-1 text-xs text-red-400 disabled:opacity-40"
                    onClick={() =>
                      void run(() =>
                        invoke("delete_model", {
                          modelId: model.id,
                        }),
                      )
                    }
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {message && (
        <p
          className={`text-xs ${
            serverStatus === "error" ? "text-red-500" : "text-zinc-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
