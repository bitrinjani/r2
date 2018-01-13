import * as i18next from 'i18next';
import { en, ja } from './stringResources';
import { getConfigRoot } from './configUtil';

let lng = 'en';

try {
  lng = getConfigRoot().language;
} catch (ex) {
  console.log(ex.message);
}

i18next.init({
  lng,
  fallbackLng: 'en',
  resources: {
    en: {
      translation: en
    },
    ja: {
      translation: ja
    }
  }
});

export default function translateTaggedTemplate(strings: TemplateStringsArray, ...keys: string[]): string {
  return i18next.t(strings.raw[0]);
}
