;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="5a212595-de56-03a4-1a2f-a3501368fdb5")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/.pnpm/@shikijs+langs@3.20.0/node_modules/@shikijs/langs/dist/ini.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
const lang = Object.freeze(JSON.parse("{\"displayName\":\"INI\",\"name\":\"ini\",\"patterns\":[{\"begin\":\"(^[\\\\t ]+)?(?=#)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.whitespace.comment.leading.ini\"}},\"end\":\"(?!\\\\G)\",\"patterns\":[{\"begin\":\"#\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.comment.ini\"}},\"end\":\"\\\\n\",\"name\":\"comment.line.number-sign.ini\"}]},{\"begin\":\"(^[\\\\t ]+)?(?=;)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.whitespace.comment.leading.ini\"}},\"end\":\"(?!\\\\G)\",\"patterns\":[{\"begin\":\";\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.comment.ini\"}},\"end\":\"\\\\n\",\"name\":\"comment.line.semicolon.ini\"}]},{\"captures\":{\"1\":{\"name\":\"keyword.other.definition.ini\"},\"2\":{\"name\":\"punctuation.separator.key-value.ini\"}},\"match\":\"\\\\b([-.0-9A-Z_a-z]+)\\\\b\\\\s*(=)\"},{\"captures\":{\"1\":{\"name\":\"punctuation.definition.entity.ini\"},\"3\":{\"name\":\"punctuation.definition.entity.ini\"}},\"match\":\"^(\\\\[)(.*?)(])\",\"name\":\"entity.name.section.group-title.ini\"},{\"begin\":\"'\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.begin.ini\"}},\"end\":\"'\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.end.ini\"}},\"name\":\"string.quoted.single.ini\",\"patterns\":[{\"match\":\"\\\\\\\\.\",\"name\":\"constant.character.escape.ini\"}]},{\"begin\":\"\\\"\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.begin.ini\"}},\"end\":\"\\\"\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.end.ini\"}},\"name\":\"string.quoted.double.ini\"}],\"scopeName\":\"source.ini\",\"aliases\":[\"properties\"]}"));
const __TURBOPACK__default__export__ = [
    lang
];
}),
]);

//# debugId=5a212595-de56-03a4-1a2f-a3501368fdb5
//# sourceMappingURL=538ec_%40shikijs_langs_dist_ini_mjs_b4c38556._.js.map