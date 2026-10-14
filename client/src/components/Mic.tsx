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
  const [speechLanguage, setSpeechLanguage] = useState("ja-JP");
  const [translationLanguage, setTranslationLanguage] = useState("en-US");
  const recognitionRef = useRef<Recognition | null>(null);
  const addSegment = useTranslationStore((state) => state.addSegment);

  const handleClick = () => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("このブラウザーは音声認識に対応していません。");
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
        if (event.error !== "no-speech" && event.error !== "aborted") alert(`音声認識エラー: ${event.error}`);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInterimText("");
      recognitionRef.current.lang = speechLanguage;
      recognitionRef.current.start();
      setIsListening(true);
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
      <button className="rounded-full bg-blue-600 px-2 py-2 text-white cursor-pointer" onClick={handleClick}>
        <MyIcon name={isListening ? "mic-listening" : "mic-idle"} color="white" size={24} />
      </button>
    </div>
  );
}

export default Mic;
