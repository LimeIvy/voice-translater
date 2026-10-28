import { speechLanguages } from "@/data/speechLanguages";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LanguageSelectProps = {
  value: string;
  onChange: (language: string) => void;
};

function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <Select
      items={speechLanguages.map((item) => ({ value: item.code, label: item.name }))}
      value={value}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string") onChange(nextValue);
      }}
    >
      <SelectTrigger className="w-45">
        <SelectValue placeholder="言語を選択" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {speechLanguages.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default LanguageSelect;
