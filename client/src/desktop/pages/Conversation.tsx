import LanguageSelect from "@/common/components/LanguageSelect";
import AudioSettings from "@/desktop/stt/AudioSettings";
import { Translation } from "@/common/translation/Translation";
import { useLanguageStore } from "@/common/stores/languageStore";
import { ArrowRightLeft } from "lucide-react";

export default function Conversation() {
  const sourceLanguage = useLanguageStore(
    (state) => state.sourceLanguage,
  );

  const targetLanguage = useLanguageStore(
    (state) => state.targetLanguage,
  );

  const setSourceLanguage = useLanguageStore(
    (state) => state.setSourceLanguage,
  );

  const setTargetLanguage = useLanguageStore(
    (state) => state.setTargetLanguage,
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header
        className="sticky top-0 z-10 w-full bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-6
  lg:px-12"
      >
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <LanguageSelect value={sourceLanguage} onChange={setSourceLanguage} />

          <span aria-hidden="true">
              <ArrowRightLeft className="h-5 w-5 text-gray-500 sm:h-6 sm:w-6" />
          </span>

          <LanguageSelect value={targetLanguage} onChange={setTargetLanguage} />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Translation
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            interimText=""
          />
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 h-20 shrink-0 w-full border-t bg-white px-4 py-3 flex items-center justify-center shadow-sm sm:h-24 sm:px-6 sm:py-4">
        <AudioSettings language={sourceLanguage} />
      </footer>
    </div>
  );
}
