
import en from '@/messages/en.json';

type Translations = typeof en;

export const useTranslations = (namespace: keyof Translations) => {
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = en[namespace];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }
    
    return value as string;
  };

  return { t };
};
