import { useTranslation } from 'react-i18next';
import { languages } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]" data-testid="select-language">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue placeholder={t('common.language')}>
          {currentLanguage.nativeName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code}
            data-testid={`option-language-${lang.code}`}
          >
            <span className="flex items-center gap-2">
              <span>{lang.nativeName}</span>
              <span className="text-muted-foreground text-xs">({lang.name})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LanguageSelectorCompact() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[100px]" data-testid="select-language-compact">
        <Globe className="h-4 w-4 mr-1" />
        <SelectValue>
          {currentLanguage.code.toUpperCase()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code}
            data-testid={`option-language-compact-${lang.code}`}
          >
            {lang.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
