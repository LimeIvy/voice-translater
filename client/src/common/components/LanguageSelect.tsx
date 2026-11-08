import { ListBox, Select } from "@heroui/react";
import { speechLanguages, type SpeechLanguageCode } from "@/common/data/speechLanguages";
import { LANGUAGES } from "@/common/constants/languages";

type LanguageSelectProps = {
  value: SpeechLanguageCode;
  onChange: (language: SpeechLanguageCode) => void;
};

type SpeechLanguage = (typeof speechLanguages)[number];

function LanguageSelect({ value, onChange }: LanguageSelectProps) {

  return (
    <Select<SpeechLanguage, "single">
      aria-label="言語"
      placeholder="言語を選択"
      selectedKey={value}
      onSelectionChange={(key) => {
        if (key !== null) {
          onChange(String(key) as SpeechLanguageCode);
        }
      }}
    >
      <Select.Trigger className="w-45">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>

      <Select.Popover>
        <ListBox<SpeechLanguage> items={speechLanguages}>
          {(item) => (
            <ListBox.Item id={item.code} textValue={item.name}>
              <span className="flex items-center gap-2">
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-6 shrink-0 rounded-sm object-cover"
                  src={`/flags/${LANGUAGES.find(({ code }) => item.code.startsWith(`${code}-`))?.flag}.png`}
                />
                <span>{item.name}</span>
              </span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export default LanguageSelect;
