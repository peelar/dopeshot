;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="660beaa9-6488-b223-f478-7247d7b43f36")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/app/src/lib/sentry.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "shouldInitializeSentryInBrowser",
    ()=>shouldInitializeSentryInBrowser,
    "shouldInitializeSentryOnServer",
    ()=>shouldInitializeSentryOnServer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$40$playwright$2b$test$40$1$2e$57$2e$0_react$2d$dom$40$19$2e$_2jqzn6f7jhus7rqmq4kivis7oe$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.7_@babel+core@7.28.5_@opentelemetry+api@1.9.0_@playwright+test@1.57.0_react-dom@19._2jqzn6f7jhus7rqmq4kivis7oe/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
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
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return isProductionHostname(window.location.hostname);
};
const shouldInitializeSentryOnServer = ()=>{
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$40$playwright$2b$test$40$1$2e$57$2e$0_react$2d$dom$40$19$2e$_2jqzn6f7jhus7rqmq4kivis7oe$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.VERCEL_ENV === "production") {
        return true;
    }
    const siteUrl = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$40$playwright$2b$test$40$1$2e$57$2e$0_react$2d$dom$40$19$2e$_2jqzn6f7jhus7rqmq4kivis7oe$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_SITE_URL ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$40$playwright$2b$test$40$1$2e$57$2e$0_react$2d$dom$40$19$2e$_2jqzn6f7jhus7rqmq4kivis7oe$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.SITE_URL;
    return isProductionHostname(hostnameFromUrl(siteUrl));
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/app/instrumentation-client.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
__turbopack_context__.s([
    "onRouterTransitionStart",
    ()=>onRouterTransitionStart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+nextjs@10.31.0_@opentelemetry+context-async-hooks@2.2.0_@opentelemetry+api@1.9.0__@op_zh7njz3led67bzp2zydqfdbebi/node_modules/@sentry/nextjs/build/esm/client/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$routing$2f$appRouterRoutingInstrumentation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+nextjs@10.31.0_@opentelemetry+context-async-hooks@2.2.0_@opentelemetry+api@1.9.0__@op_zh7njz3led67bzp2zydqfdbebi/node_modules/@sentry/nextjs/build/esm/client/routing/appRouterRoutingInstrumentation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$src$2f$lib$2f$sentry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/src/lib/sentry.ts [app-client] (ecmascript)");
globalThis["_sentryRouteManifest"] = "{\"dynamicRoutes\":[],\"staticRoutes\":[{\"path\":\"/\"},{\"path\":\"/auth\"}],\"isrRoutes\":[]}";
globalThis["_sentryNextJsVersion"] = "16.0.7";
globalThis["_sentryRewritesTunnelPath"] = "/monitoring";
;
;
if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$src$2f$lib$2f$sentry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shouldInitializeSentryInBrowser"])()) {
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["init"]({
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
const onRouterTransitionStart = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$31$2e$0_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_$5f40$op_zh7njz3led67bzp2zydqfdbebi$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$routing$2f$appRouterRoutingInstrumentation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureRouterTransitionStart"];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=660beaa9-6488-b223-f478-7247d7b43f36
//# sourceMappingURL=apps_app_6e0766b2._.js.map