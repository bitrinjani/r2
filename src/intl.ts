import * as i18next from 'i18next';
import { en, ja } from './stringResources';
import { getConfigRoot } from './util';

i18next.init({
  lng: getConfigRoot().language,
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

export default s => i18next.t(s);
