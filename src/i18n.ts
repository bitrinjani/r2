import * as i18next from "i18next";

import { getConfigRoot } from "./configUtil";
import { en, ja } from "./stringResources";

let lng = "en";

try{
  lng = getConfigRoot().language;
} catch(ex){
  console.log(ex.message);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
i18next.init({
  lng,
  fallbackLng: "en",
  resources: {
    en: {
      translation: en,
    },
    ja: {
      translation: ja,
    },
  },
});

export default function translateTaggedTemplate(strings: TemplateStringsArray, ...keys: string[]): string {
  return i18next.t(strings.raw[0]);
}
