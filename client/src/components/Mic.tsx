import { useRef, useState } from "react";
import { MyIcon } from "./Icons";
import LanguageSelect from "./LanguageSelect";
import { Translation } from "./Translation";
import { useTranslationStore } from "../store/translation";

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: Event & { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

function Mic() {
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [micError, setMicError] = useState("");
  const permissionPendingRef = useRef(false);
  const [speechLanguage, setSpeechLanguage] = useState("ja-JP");
  const [translationLanguage, setTranslationLanguage] = useState("en-US");
  const recognitionRef = useRef<Recognition | null>(null);
  const addSegment = useTranslationStore((state) => state.addSegment);

  const handleClick = async () => {
    if (permissionPendingRef.current) return;
    setMicError("");
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("このブラウザは音声認識に対応していません。");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.onresult = (event) => {
        const finalChunks: string[] = [];
        const interimChunks: string[] = [];
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalChunks.push(result[0].transcript.trim());
          else interimChunks.push(result[0].transcript);
        }
        setInterimText(interimChunks.join(" "));
        finalChunks.filter(Boolean).forEach(addSegment);
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicError("音声入力が許可されていません。ブラウザのサイト設定と端末の設定で、マイク・音声認識を許可してください。");
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          setMicError(`音声認識エラー: ${event.error}`);
        }
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setMicError("マイクを使用するには、HTTPSでこのページを開いてください。");
        return;
      }
      permissionPendingRef.current = true;
      setIsRequestingPermission(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setInterimText("");
        recognitionRef.current.lang = speechLanguage;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        setMicError(name === "NotAllowedError"
          ? "マイクが許可されていません。ブラウザーのサイト設定と端末の設定でマイクを許可し、もう一度ボタンを押してください。"
          : "音声入力を開始できませんでした。マイクの接続や、他のアプリで使用中でないか確認してください。");
      } finally {
        permissionPendingRef.current = false;
        setIsRequestingPermission(false);
      }
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full items-center justify-center gap-4">
        <p>発話言語</p>
        <LanguageSelect value={speechLanguage} onChange={setSpeechLanguage} />
        <p>翻訳言語</p>
        <LanguageSelect value={translationLanguage} onChange={setTranslationLanguage} />
      </div>
      
      <Translation
        sourceLanguage={speechLanguage}
        targetLanguage={translationLanguage}
        interimText={interimText}
      />
      <button
        type="button"
        className="rounded-full bg-blue-600 px-2 py-2 text-white cursor-pointer disabled:opacity-50"
        onClick={handleClick}
        disabled={isRequestingPermission}
        aria-label={isListening ? "音声入力を停止" : "マイクを許可して音声入力を開始"}
      >
        <MyIcon name={isListening ? "mic-listening" : "mic-idle"} color="white" size={24} />
      </button>
      {isRequestingPermission && <p className="text-sm text-muted-foreground" role="status">マイクの使用を許可してください。</p>}
      {micError && <p className="max-w-sm text-sm text-destructive" role="alert">{micError}</p>}
    </div>
  );
}

export default Mic;
