"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const i18next = require("i18next");
const stringResources_1 = require("./stringResources");
const configUtil_1 = require("./configUtil");
let lng = 'en';
try {
    lng = (0, configUtil_1.getConfigRoot)().language;
}
catch (ex) {
    console.log(ex.message);
}
i18next.init({
    lng,
    fallbackLng: 'en',
    resources: {
        en: {
            translation: stringResources_1.en
        },
        ja: {
            translation: stringResources_1.ja
        }
    }
});
function translateTaggedTemplate(strings, ...keys) {
    return i18next.t(strings.raw[0]);
}
exports.default = translateTaggedTemplate;
