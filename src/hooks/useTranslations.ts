import en from "@/messages/en.json";

type Translations = typeof en;

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

type LeafPaths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? T[K] extends object
            ? Join<K, LeafPaths<T[K], Prev[D]>>
            : `${K}`
          : never;
      }[keyof T]
    : "";

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type TranslationKey<N extends keyof Translations | undefined> =
  N extends keyof Translations
    ? LeafPaths<Translations[N]>
    : LeafPaths<Translations>;

export const useTranslations = <N extends keyof Translations | undefined>(
  namespace?: N,
) => {
  const t = (key: TranslationKey<N>) => {
    const keys = (key as string).split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = namespace ? en[namespace] : en;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }

    return typeof value === "string" ? value : key;
  };

  return { t };
};
