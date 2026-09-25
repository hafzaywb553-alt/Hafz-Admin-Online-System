// ==========================================
// Hafz PWA Service Worker
// ==========================================

"use strict";


// ==========================================
// Version
// ==========================================

const BUILD_VERSION = "__BUILD_VERSION__";

const CACHE_VERSION =
    `hafz-cache-${BUILD_VERSION}`;


// ==========================================
// Cache Name
// ==========================================

const CACHE_NAME =
    CACHE_VERSION;


// ==========================================
// Files
// ==========================================

const APP_SHELL = [

    "./",

    "./index.html",

    "./admin.html",

    "./register.html",

    "./dashboard.html",

    "./search.html",

    "./reports.html",

    "./settings.html",

    "./formic.html",

    "./profession-education/profession-education.html",

    "./profession-education/profession-education.js",

    "./style.css",

    "./pwa.js"

];


// ==========================================
// Install
// ==========================================

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(
                    CACHE_NAME
                )
                .then(
                    cache =>

                        cache.addAll(
                            APP_SHELL
                        )

                )
                .catch(
                    error => {

                        console.error(
                            "SW cache install error:",
                            error
                        );

                    }
                )

        );

        /*
         * د Update د ژر فعالېدو لپاره
         */
        self.skipWaiting();

    }
);


// ==========================================
// Activate
// ==========================================

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            Promise.all([

                self.clients.claim(),

                caches
                    .keys()
                    .then(
                        keys =>

                            Promise.all(

                                keys
                                    .filter(
                                        key =>
                                            key !==
                                            CACHE_NAME
                                    )
                                    .map(
                                        key =>
                                            caches.delete(
                                                key
                                            )
                                    )

                            )

                    )

            ])

        );

    }
);


// ==========================================
// Message
// ==========================================

self.addEventListener(
    "message",
    event => {

        if (
            event.data?.type ===
            "SKIP_WAITING"
        ) {

            self.skipWaiting();

        }

    }
);


// ==========================================
// Fetch
// ==========================================

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;

        /*
         * یوازې GET
         */

        if (
            request.method !==
            "GET"
        ) {

            return;

        }


        /*
         * Firebase او بهرني API
         * عادي Network ته پرېږدو.
         */

        const url =
            new URL(
                request.url
            );

        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }

        /*
         * Service Worker او version.json باید هېڅکله
         * د زړې Cache نسخې څخه ونه لوستل شي.
         */
        const pathname =
            url.pathname || "";

        if (
            pathname.endsWith("/sw.js") ||
            pathname.endsWith("/version.json")
        ) {

            event.respondWith(
                fetch(
                    request,
                    {
                        cache: "no-store"
                    }
                )
            );

            return;

        }


        event.respondWith(

            fetch(
                request,
                {
                    cache: "no-store"
                }
            )
            .then(
                response => {

                    /*
                     * نوی Response Cache کړه.
                     */

                    if (
                        response &&
                        response.status === 200
                    ) {

                        const clone =
                            response.clone();

                        caches
                            .open(
                                CACHE_NAME
                            )
                            .then(
                                cache => {

                                    cache.put(
                                        request,
                                        clone
                                    );

                                }
                            )
                            .catch(
                                () => {}
                            );

                    }

                    return response;

                }
            )
            .catch(
                async () => {

                    const cached =
                        await caches.match(
                            request
                        );

                    if (
                        cached
                    ) {

                        return cached;

                    }

                    return new Response(
                        "انټرنېټ ته اتصال نشته.",
                        {
                            status:
                                503,
                            headers: {
                                "Content-Type":
                                    "text/plain; charset=utf-8"
                            }
                        }
                    );

                }
            )

        );

    }
);