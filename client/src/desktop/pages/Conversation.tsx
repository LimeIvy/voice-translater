import LanguageSelect from "@/common/components/LanguageSelect";
import AudioSettings from "@/desktop/stt/AudioSettings";
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
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-center gap-4">
        <LanguageSelect
          value={sourceLanguage}
          onChange={setSourceLanguage}
        />

        <span aria-hidden="true">
          <ArrowRightLeft className="h-6 w-6 text-gray-500" />
        </span>

        <LanguageSelect
          value={targetLanguage}
          onChange={setTargetLanguage}
        />
      </div>

      <div className="flex justify-center">
        <AudioSettings language={sourceLanguage} />
      </div>
    </div>
  );
}
