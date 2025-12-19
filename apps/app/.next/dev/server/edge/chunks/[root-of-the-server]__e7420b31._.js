(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__e7420b31._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[project]/apps/app/src/lib/sentry.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "shouldInitializeSentryInBrowser",
    ()=>shouldInitializeSentryInBrowser,
    "shouldInitializeSentryOnServer",
    ()=>shouldInitializeSentryOnServer
]);
const productionHostnames = [
    "app.dopeshot.io",
    "dopeshot.io",
    "www.dopeshot.io"
];
const normalizeHostname = (hostname)=>{
    if (!hostname) return undefined;
    return hostname.split(":")[0].trim().toLowerCase();
};
const hostnameFromUrl = (value)=>{
    if (!value) return undefined;
    try {
        return new URL(value).hostname;
    } catch  {
        return value;
    }
};
const isProductionHostname = (hostname)=>{
    const normalized = normalizeHostname(hostname);
    return normalized !== undefined && productionHostnames.includes(normalized);
};
const shouldInitializeSentryInBrowser = ()=>{
    if ("TURBOPACK compile-time truthy", 1) {
        return false;
    }
    //TURBOPACK unreachable
    ;
};
const shouldInitializeSentryOnServer = ()=>{
    if (process.env.VERCEL_ENV === "production") {
        return true;
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
    return isProductionHostname(hostnameFromUrl(siteUrl));
};
}),
"[project]/apps/app/sentry.edge.config.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$edge$2f$index$2e$js__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+nextjs@10.31.0_@opentelemetry+context-async-hooks@2.2.0_@opentelemetry+api@1.9.0__@op_zh7njz3led67bzp2zydqfdbebi/node_modules/@sentry/nextjs/build/esm/edge/index.js [instrumentation-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$src$2f$lib$2f$sentry$2e$ts__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/src/lib/sentry.ts [instrumentation-edge] (ecmascript)");
;
;
if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$src$2f$lib$2f$sentry$2e$ts__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__["shouldInitializeSentryOnServer"])()) {
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$edge$2f$index$2e$js__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["init"]({
        dsn: "https://9f200f1a17e162d8ed896dc131c28df6@o1063276.ingest.us.sentry.io/4510550056632320",
        // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
        tracesSampleRate: 1,
        // Enable logs to be sent to Sentry
        enableLogs: true,
        // Enable sending user PII (Personally Identifiable Information)
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
        sendDefaultPii: true
    });
}
}),
"[project]/apps/app/instrumentation.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "onRequestError",
    ()=>onRequestError,
    "register",
    ()=>register
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$common$2f$captureRequestError$2e$js__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+nextjs@10.31.0_@opentelemetry+context-async-hooks@2.2.0_@opentelemetry+api@1.9.0__@op_zh7njz3led67bzp2zydqfdbebi/node_modules/@sentry/nextjs/build/esm/common/captureRequestError.js [instrumentation-edge] (ecmascript)");
globalThis["_sentryNextJsVersion"] = "16.0.7";
globalThis["_sentryRewritesTunnelPath"] = "/monitoring";
;
async function register() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if ("TURBOPACK compile-time truthy", 1) {
        await Promise.resolve().then(()=>__turbopack_context__.i("[project]/apps/app/sentry.edge.config.ts [instrumentation-edge] (ecmascript)"));
    }
}
const onRequestError = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$common$2f$captureRequestError$2e$js__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__["captureRequestError"];
}),
"[project]/apps/app/edge-wrapper.js { MODULE => \"[project]/apps/app/instrumentation.ts [instrumentation-edge] (ecmascript)\" } [instrumentation-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {

self._ENTRIES ||= {};
const modProm = Promise.resolve().then(()=>__turbopack_context__.i("[project]/apps/app/instrumentation.ts [instrumentation-edge] (ecmascript)"));
modProm.catch(()=>{});
self._ENTRIES["middleware_instrumentation"] = new Proxy(modProm, {
    get (modProm, name) {
        if (name === "then") {
            return (res, rej)=>modProm.then(res, rej);
        }
        let result = (...args)=>modProm.then((mod)=>(0, mod[name])(...args));
        result.then = (res, rej)=>modProm.then((mod)=>mod[name]).then(res, rej);
        return result;
    }
});
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__e7420b31._.js.map