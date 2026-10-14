import { useRef, useState } from "react";
import { MyIcon } from "./Icons";
import LanguageSelect from "./LanguageSelect";
import { Translation } from "./Translation";

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: Event & { results: SpeechRecognitionResultList }) => void) | null;
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
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("ja-JP");
  const [translationLanguage, setTranslationLanguage] = useState("en-US");
  const recognitionRef = useRef<Recognition | null>(null);

  const handleClick = () => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("このブラウザーは音声認識に対応していません。");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.interimResults = true;
      recognitionRef.current.continuous = true;
      recognitionRef.current.onresult = (event) => {
        setText(Array.from(event.results).map((result) => result[0].transcript).join(""));
      };
      console.log(speechLanguage);
      recognitionRef.current.onerror = (event) => {
        alert(`音声認識エラー: ${event.error}`);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setText("");
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

      <p className="min-h-8 w-4/5 rounded border p-2" aria-live="polite">
        {text || "認識した音声がここに表示されます"}
      </p>
      <Translation
        text={text}
        sourceLanguage={speechLanguage}
        targetLanguage={translationLanguage}
      />
      <button
        className="rounded-full bg-blue-600 px-4 py-2 text-white"
        onClick={handleClick}
      >
        <MyIcon
          name={isListening ? "mic-listening" : "mic-idle"}
          color="white"
        />
      </button>
    </div>
  );
}

export default Mic;
