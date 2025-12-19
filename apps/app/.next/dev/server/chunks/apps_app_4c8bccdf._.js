;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="cbfa7576-7055-1c52-868c-a4034a0613d9")}catch(e){}}();
module.exports = [
"[project]/apps/app/src/lib/sentry.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/apps/app/sentry.server.config.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$cjs$2f$index$2e$server$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+nextjs@10.31.0_@opentelemetry+context-async-hooks@2.2.0_@opentelemetry+api@1.9.0__@op_zh7njz3led67bzp2zydqfdbebi/node_modules/@sentry/nextjs/build/cjs/index.server.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$src$2f$lib$2f$sentry$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/src/lib/sentry.ts [instrumentation] (ecmascript)");
;
;
if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$src$2f$lib$2f$sentry$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["shouldInitializeSentryOnServer"])()) {
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$cjs$2f$index$2e$server$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["init"]({
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
];

//# debugId=cbfa7576-7055-1c52-868c-a4034a0613d9
//# sourceMappingURL=apps_app_4c8bccdf._.js.map