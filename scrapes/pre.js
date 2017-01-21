define("pre", function() {}),
    function(e) {
        var t = "warn",
            n = ["debug", "info", "warn", "error"],
            r = function(e) {
                return n.indexOf(e) >= n.indexOf(t)
            };
        console.log.bind || (console.log.bind = Function.prototype.bind), console.info.bind || (console.info.bind = Function.prototype.bind), console.warn.bind || (console.warn.bind = Function.prototype.bind), console.error.bind || (console.error.bind = Function.prototype.bind), console.time.bind || (console.time.bind = Function.prototype.bind), console.timeEnd.bind || (console.timeEnd.bind = Function.prototype.bind), e.FF.logger = {
            debug: function() {
                return r("debug") ? console.log.bind(console) : function() {}
            }(),
            info: function() {
                return r("info") ? console.info.bind(console) : function() {}
            }(),
            warn: function() {
                return r("warn") ? console.warn.bind(console) : function() {}
            }(),
            error: function() {
                return r("error") ? console.error.bind(console) : function() {}
            }(),
            time: function() {
                return console.time.bind(console)
            }(),
            timeEnd: function() {
                return console.timeEnd.bind(console)
            }(),
            dump: function() {
                e.JSON && e.JSON.stringify ? e.FF.logger.debug(e.JSON.stringify(arguments[0], void 0, "	")) : e.FF.logger.debug.apply(null, arguments)
            }
        }
    }(this.self || global), define("logger", function() {}), "kickmotor" in window && !("options" in kickmotor) && (kickmotor.options = {
        fcache: {
            protocol: "http",
            port: 26284,
            urlGetBundle: "get_bundle",
            downloadTimeoutMsec: 3e4,
            canUseCProxy: !0
        },
        clientrContentDirectoryPath: "/Content",
        serverStaticContentUrl: "static",
        disableNativeConsoleLog: !1
    }),
    function(e, t) {
        function p(e) {
            c(e)
        }

        function d() {
            280 <= H() && (s = setInterval(function() {
                y.length > 0 && c(b + A()), l = 0
            }, 1e3 / r))
        }

        function v() {
            d(), t.nativefn.onApplicationForeground()
        }

        function m() {
            s && clearInterval(s), s = null, t.nativefn.onApplicationBackground()
        }

        function g() {
            t.nativefn.onShakeBegan()
        }

        function E(e, t) {
            t = t || {
                pageBound: !1
            };
            var n = parseInt(sessionStorage.getItem(b + "callbackNextId") || "0", 10);
            return sessionStorage.setItem(b + "callbackNextId", ++n), w[n] = {
                fn: e,
                pageBound: t.pageBound
            }, n
        }

        function S(e) {
            delete w[e]
        }

        function x() {
            var e = [];
            for (var t in w) w[t].pageBound && e.push(t);
            for (var n = 0; n < e.length; n++) S(e[n])
        }

        function T(e, t) {
            t = t || {
                pageBound: !0
            };
            var n, r = function(t) {
                S(n), e(t)
            };
            return n = E(r, t), n
        }

        function N(e, t) {
            var n = w[e];
            n && n.fn(t)
        }

        function k(e, t) {
            C(e, t)
        }

        function L(e) {
            if (D()) {
                var t = Array.prototype.slice.call(arguments, 1);
                window.sphybrid[e].apply(null, t)
            }
        }

        function O() {
            return h = (new Date).getTime(), A()
        }

        function M() {
            var e = (new Date).getTime();
            return h > e && (h = e), e - h
        }

        function _() {
            return typeof _ios != "undefined" ? "ios" : -1 !== navigator.userAgent.indexOf("_android") ? "android" : ""
        }

        function D() {
            return _() !== ""
        }

        function P(e) {
            var t;
            return (t = (new RegExp("(?:^|; )" + encodeURIComponent(e) + "=([^;]*)")).exec(document.cookie)) ? t[1] : ""
        }

        function H() {
            return parseInt(P("ci_appversion"), 10)
        }

        function B() {
            return parseFloat(P("ci_systemversion"))
        }

        function j() {
            return parseInt(P("ci_logical_screen_height") || "480", 10)
        }

        function F() {
            return P("ci_applanguage")
        }

        function I() {
            return parseInt(P("ci_native_ajax"), 10)
        }

        function q(e, t) {
            e = typeof e == "string" ? e : "";
            var n = T(t);
            k("playVideo", {
                file: e,
                callback: n
            })
        }

        function R() {
            k("pauseVideo")
        }

        function U() {
            k("resumeVideo")
        }

        function z(e) {
            e = typeof e == "string" ? e : "", k("setPasteboard", {
                text: e
            })
        }

        function W(e) {
            var t = T(e);
            k("checkSocialService", {
                callback: t
            })
        }

        function X(e, t, n, r, i) {
            e = typeof e == "string" ? e.toLowerCase() : "", t = typeof t == "string" ? t : "", n = typeof n == "string" ? n : "", r = typeof r == "string" ? r : "";
            var s = T(i);
            k("postToSocialService", {
                service: e,
                text: t,
                url: n,
                imageURL: r,
                callback: s
            })
        }

        function V(e) {
            var t = T(e);
            k("clientInfo", {
                callback: t
            })
        }

        function $(e) {
            e = typeof e == "boolean" ? e : Boolean(e), k("setIsEnableTouchEvent", {
                isEnable: e
            })
        }

        function J(e, t, n) {
            t = typeof t == "string" ? t : "", n = typeof n == "string" ? n : "";
            var r = T(e);
            k("checkInstalled", {
                packageName1: t,
                packageName2: n,
                callback: r
            })
        }

        function K(e, t) {
            e = typeof e == "string" ? e : "", k("intentShare", {
                packageName: t,
                text: e
            })
        }

        function Q(e) {
            e = e || "", k("forceLoadPath", {
                path: e
            })
        }

        function G() {
            return parseInt(P("ci_is_use_16_9")) ? !0 : !1
        }

        function Y(e) {
            var t = T(e);
            k("storeTwitterAccessToken", {
                callback: t
            })
        }

        function Z() {
            k("clearTwitterAccessToken")
        }

        function et(e) {
            var t = T(e);
            k("hasTwitterAccessToken", {
                callback: t
            })
        }

        function tt(e) {
            var t = T(e);
            k("getTwitterScreenName", {
                callback: t
            })
        }

        function nt(e) {
            var t = T(e);
            k("getRemoteNotificationLog", {
                callback: t
            })
        }

        function rt(e) {
            var t = T(e);
            k("getUrlSchemeLog", {
                callback: t
            })
        }

        function it(e) {
            var t = T(e);
            k("clearUrlSchemeLog", {
                callback: t
            })
        }

        function st(e, t) {
            if (_() == "android") {
                undefined !== t && setTimeout(function() {
                    t()
                }, 1);
                return
            }
            n = e, e ? f.attr("src", "nativefn://resumeWebViewBridge") : f.attr("src", "nativefn://suspendWebViewBridge"), undefined !== t && setTimeout(function() {
                t()
            }, 1)
        }

        function ot(e) {
            var t = T(e);
            k("webViewInfo", {
                callback: t
            })
        }

        function ut(e) {
            var t = T(e);
            k("getFrameRate", {
                callback: t
            })
        }

        function at(e) {
            var t = T(e);
            k("isNetworkEnable", {
                callback: t
            })
        }

        function ft(e, t, n) {
            e = typeof e == "string" ? e : "", t = typeof t == "string" ? t : "";
            if (_() === "android") k("launchExternalApplication", {
                packageName: t,
                params: n
            });
            else {
                var r = e + "?";
                for (key in n) r += key + "=" + n[key] + "&";
                r = r.slice(0, -1), kickmotor.platform.openExternalURL(r)
            }
        }

        function lt(e) {
            e = typeof e == "string" ? e : "", _() === "android" ? k("openURLScheme", {
                url: e
            }) : kickmotor.platform.openExternalURL(e)
        }

        function ct(e) {
            k("setShakeListenerIsEnable", {
                isEnable: e
            })
        }

        function ht(e, n) {
            var r = {
                cvpointId: e
            };
            undefined !== n && t.extend(r, n), k("foxSendLtv", r)
        }

        function pt(e, n) {
            var r = {
                eventName: e
            };
            undefined !== n && t.extend(r, n), k("foxSendEvent", r)
        }

        function dt(e, t, n) {
            e = typeof e == "string" ? e : "", t = typeof t == "string" ? t : "";
            var r = T(n);
            k("Cefca", {
                text: e,
                digest: t,
                callback: r
            })
        }

        function vt(e, t) {
            e = typeof e == "string" ? e : "";
            var n = T(t);
            k("Ultimecia", {
                text: e,
                callback: n
            })
        }

        function mt(e, t) {
            e = typeof e == "string" ? e : "";
            var n = T(t);
            k("Edea", {
                text: e,
                callback: n
            })
        }

        function gt(e) {
            var t = T(e);
            k("Crystal", {
                callback: t
            })
        }

        function yt(e) {
            var t = T(e);
            k("hideMobageUserIdLabel", {
                callback: t
            })
        }

        function wt() {}
        var n = !0,
            r = 15,
            i = 1,
            s = null,
            o = !!e.self,
            u = !!e.WorkerLocation,
            a = !!e.global,
            f, l = 0,
            c = function(e) {
                console.log(e)
            },
            h = 0,
            y = [],
            b = "nativefn:",
            w = {},
            C = function(e, t) {
                280 <= H() ? D() ? _() == "android" ? C = function(e, t) {
                    var n = e + JSON.stringify(t || {});
                    l < i ? (l++, c(b + n)) : y.push(n)
                } : C = function(e, t) {
                    y.push(e + JSON.stringify(t || {})), !1 === n && f.attr("src", "nativefn://pump")
                } : C = function(e, t) {} : C = function(e, t) {
                    if (D()) {
                        t = t || {};
                        var n = e + JSON.stringify(t);
                        _() === "android" ? c("nativefn:" + n) : (y.unshift(n), y.length === 1 && f.attr("src", "nativefn://call"))
                    }
                }, C(e, t)
            },
            A = function() {
                return 280 <= H() ? A = function() {
                    var e = y.join("\n");
                    return y.length = 0, e
                } : A = function() {
                    return y.length === 0 ? "" : y.pop()
                }, A()
            },
            bt = {
                registerCallback: E,
                unregisterCallback: S,
                unregisterPageBoundCallbacks: x,
                autoUnregisterCallback: T,
                sendCommandToNative: p,
                callCallback: N,
                call: k,
                sphCall: L,
                pump: O,
                getSuspendElapsedTime: M,
                getNativeOS: _,
                isNative: D,
                getAppVersion: H,
                getSystemVersion: B,
                getLogicalScreenHeight: j,
                getIsNativeAjax: I,
                playVideo: q,
                stopVideo: function() {
                    k("stopVideo")
                },
                syncPersistentCookie: function() {
                    k("syncPersistentCookie")
                },
                clearMemoryCache: function() {
                    k("clearMemoryCache")
                },
                setPasteboard: z,
                checkSocialService: W,
                postToSocialService: X,
                makeKeyAndVisible: function() {
                    k("makeKeyAndVisible")
                },
                setIsEnableTouchEvent: $,
                clientInfo: V,
                checkInstalled: J,
                intentShare: K,
                forceLoadPath: Q,
                isUse16_9: G,
                storeTwitterAccessToken: Y,
                clearTwitterAccessToken: Z,
                hasTwitterAccessToken: et,
                getTwitterScreenName: tt,
                getRemoteNotificationLog: nt,
                getUrlSchemeLog: rt,
                clearUrlSchemeLog: it,
                setPumpASyncMode: st,
                webViewInfo: ot,
                getFrameRate: ut,
                isNetworkEnable: at,
                pauseVideo: R,
                resumeVideo: U,
                launchExternalApplication: ft,
                openURLScheme: lt,
                setShakeListenerIsEnable: ct,
                foxSendLtv: ht,
                foxSendEvent: pt,
                Cefca: dt,
                Ultimecia: vt,
                Edea: mt,
                Crystal: gt,
                hideUserIdLabel: yt,
                androidApplicationForeground: v,
                androidApplicationBackground: m,
                androidShakeBegan: g,
                onBackKey: function() {
                    console.log("onBackKey")
                },
                onApplicationForeground: function() {
                    console.log("onApplicationForeground")
                },
                onApplicationBackground: function() {
                    console.log("onApplicationBackground")
                },
                onCallStateDialing: function() {
                    console.log("onCallStateDialing")
                },
                onCallStateIncoming: function() {
                    console.log("onCallStateIncoming")
                },
                onCallStateConnected: function() {
                    console.log("onCallStateConnected")
                },
                onCallStateDisconnected: function() {
                    console.log("onCallStateDisconnected")
                },
                onShakeBegan: function() {
                    console.log("onShakeBegan")
                },
                getLanguageSetting: F
            };
        wt.prototype = bt, t.nativefn = new wt, t(function() {
            f = t('<iframe style="display:none;" height="0px" width="0px" frameborder="0"/>'), t("body").append(f), _() === "ios" && !kickmotor.options.disableNativeConsoleLog && (console = {}, console.log = function(e) {
                k("consoleLog", {
                    msg: e
                })
            }, console.debug = console.log, console.info = console.log, console.warn = console.log, console.error = console.log);
            if (_() === "android") {
                var e = T(function(e) {
                    c = function(e) {
                        console.log(e)
                    }
                });
                k("testCallback", {
                    callback: e
                }), c = function(e) {
                    alert(e)
                }, d()
            }
        }), a ? module.exports = bt : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.nativefn = bt)
    }(this.self || global, jQuery),
    function(e, t) {
        function l() {
            return e.kickmotor.nativefn.isNative() ? o : s
        }

        function c(e) {
            var t = {},
                n;
            for (n in e) {
                var r = e[n];
                r.body && r.hash && (t[n] = r)
            }
            l().mset(t);
            for (n in t) a.setItem(u + n, t[n].hash)
        }

        function h(e, t) {
            for (var n in e) {
                var r = e[n],
                    i = a.getItem(u + n);
                r.hash && r.hash === i ? t.bundle[n] = {
                    hash: r.hash
                } : t.requestPaths.push(n)
            }
        }

        function p(e, t) {
            l().mgetOrMexists(e.bundle, e.needsBody, function(n, r) {
                if (n) t(n);
                else {
                    for (var i in r) {
                        var s = r[i];
                        e.needsBody ? s.body ? e.bundle[i].body = s.body : e.requestPaths.push(i) : s.exists || e.requestPaths.push(i)
                    }
                    0 < e.requestPaths.length ? d(e, t) : t(null, e.bundle)
                }
            })
        }

        function d(n, r) {
            var i = e.kickmotor.options.fcache.urlGetBundle;
            t.ajax({
                url: i,
                type: "POST",
                timeout: e.kickmotor.options.fcache.downloadTimeoutMsec,
                dataType: "json",
                cache: !1,
                data: {
                    paths: n.requestPaths.join(",")
                },
                error: function(e, t, n) {
                    console.warn(i + " failed " + t + " " + n), r(i + " failed")
                },
                success: function(e) {
                    if (e.success && e.bundle) {
                        c(e.bundle);
                        for (var t in e.bundle) {
                            var s = e.bundle[t];
                            n.needsBody ? n.bundle[t] = s : n.bundle[t] = {
                                hash: s.hash
                            }
                        }
                        r(null, n.bundle)
                    } else console.warn(i + " failed"), r(i + " failed")
                }
            })
        }

        function v(e, t, n) {
            var r = {
                needsBody: t,
                bundle: {},
                requestPaths: []
            };
            h(e, r), p(r, n)
        }

        function m() {
            var e = navigator.userAgent;
            return e.indexOf("Android 2.3") >= 0
        }

        function y(n) {
            return 1 !== e.kickmotor.nativefn.getIsNativeAjax() ? g = t.ajax : g = b, g(n)
        }

        function b(n) {
            var r = new t.Deferred,
                i = e.kickmotor.nativefn.registerCallback(function(e) {
                    var t = e._status,
                        n = e.xhr,
                        i = {};
                    n.responseText = decodeURIComponent(n.responseText), e.succeed ? r.resolve(i, t, n) : r.reject(n, t, i)
                });
            return e.kickmotor.nativefn.call("ajax", {
                callbackId: i,
                url: n.url,
                data: t.param(n.data || {}),
                type: n.type,
                timeout: n.timeout
            }), r.promise()
        }

        function E(t, n, r, i, s) {
            e.kickmotor.options.fcache.multiPrecacheAvailable === !1 ? w.cache(t, null, function(e) {
                r(e, t)
            }) : w.multiPrecache(t, n, r, i, s)
        }

        function S(t, n) {
            var r = D(t);
            0 < r.length ? g({
                url: e.kickmotor.options.fcache.protocol + "://127.0.0.1:" + e.kickmotor.options.fcache.port + "/check_precache",
                type: "POST",
                data: {
                    url_vers: r.join(",")
                },
                timeout: e.kickmotor.options.fcache.downloadTimeoutMsec,
                async: !m()
            }).done(function() {
                n(null)
            }).fail(function(e) {
                var t = e.responseText;
                n(t)
            }) : n("There is no specified Bundle", t)
        }

        function x(e, t) {
            function n(e, n, r, i) {
                t(e, r, i)
            }
            w.cache(e, t, n)
        }

        function T(t) {
            var n = e.kickmotor.options.clientrContentDirectoryPath;
            n.charAt(0) !== "/" && (n = "/" + n), g({
                url: e.kickmotor.options.fcache.protocol + "://127.0.0.1:" + e.kickmotor.options.fcache.port + "/get_precache_size?db_name=cache",
                type: "POST",
                data: {},
                timeout: e.kickmotor.options.fcache.downloadTimeoutMsec,
                async: !m()
            }).done(function(e) {
                var n = 0;
                for (var r in e) r === "size" && (n = e[r]);
                t(null, n)
            }).fail(function(e) {
                var n = e.responseText;
                t("faile to get cached size", n)
            })
        }

        function N(e, t, n, r, i, s) {
            _() ? E(e, n, r, i, s) : v(e, t, r)
        }

        function C(e, t) {
            S(e, t)
        }

        function k(e, t) {
            x(e, function(e, n, r) {
                e ? t(e) : t(null, n, r)
            })
        }

        function L(e) {
            T(e)
        }

        function A() {
            var t = [],
                n;
            for (n = 0; n < a.length; n++) {
                var r = a.key(n);
                r.indexOf(u) === 0 && t.push(r)
            }
            for (n = 0; n < t.length; n++) a.removeItem(t[n]);
            l().clear(), kickmotor.options.fcache.canUseCProxy && g({
                url: e.kickmotor.options.fcache.protocol + "://127.0.0.1:" + e.kickmotor.options.fcache.port + "/drop_open_database?db_name=cache",
                type: "POST",
                async: !1
            })
        }

        function O(t) {
            if (kickmotor.options.fcache.canUseCProxy) {
                var n = D(t);
                0 < n.length && g({
                    url: e.kickmotor.options.fcache.protocol + "://127.0.0.1:" + e.kickmotor.options.fcache.port + "/delete_specified_iles?db_name=cache",
                    type: "POST",
                    data: {
                        url_vers: n.join(",")
                    },
                    async: !1
                })
            }
        }

        function M(t) {
            kickmotor.options.fcache.canUseCProxy && g({
                url: e.kickmotor.options.fcache.protocol + "://127.0.0.1:" + e.kickmotor.options.fcache.port + "/delete_expired_files?db_name=cache",
                type: "POST",
                data: {
                    expired: t
                },
                async: !1
            })
        }

        function _() {
            return kickmotor.options.fcache.canUseCProxy && 250 <= e.kickmotor.nativefn.getAppVersion()
        }

        function D(t) {
            var n = e.kickmotor.options.serverStaticContentUrl,
                r = e.kickmotor.options.clientrContentDirectoryPath;
            r.charAt(0) !== "/" && (r = "/" + r);
            var i = new RegExp("^" + r),
                s = new RegExp(r),
                o = [];
            for (var u in t) {
                var a = " " + u;
                if (a.indexOf(" sound:") !== -1) var f = u.replace(s, n);
                else var f = u.replace(i, n);
                var l = t[u].hash;
                o.push(f, l)
            }
            return o
        }
        var n = !!e.self,
            r = !!e.WorkerLocation,
            i = !!e.global,
            s = function() {
                var e = {};
                return {
                    mset: function(t) {
                        for (var n in t) e[n] = t[n].body
                    },
                    mgetOrMexists: function(t, n, r) {
                        var i = {};
                        for (var s in t) {
                            var o = {};
                            e[s] && (n ? o.body = e[s] : o.exists = !0), i[s] = o
                        }
                        setTimeout(function() {
                            r(null, i)
                        }, 0)
                    },
                    clear: function() {
                        e = {}
                    }
                }
            }(),
            o = function() {
                return {
                    mset: function(t) {
                        e.kickmotor.nativefn.call("storageMset", {
                            bundle: t
                        })
                    },
                    mgetOrMexists: function(t, n, r) {
                        var i = e.kickmotor.nativefn.autoUnregisterCallback(function(e) {
                            r(e.err, e.bundle)
                        }, {
                            pageBound: !1
                        });
                        e.kickmotor.nativefn.call("storageMgetOrMexists", {
                            bundle: t,
                            needsBody: n,
                            callback: i
                        })
                    },
                    clear: function() {
                        e.kickmotor.nativefn.call("storageClear")
                    }
                }
            }(),
            u = "fcache:",
            a = localStorage,
            f = {},
            g = y,
            w = {
                multiPrecache: function(t, n, r, i, s) {
                    var o = D(t),
                        u = e.kickmotor.options.fcache.protocol,
                        a = e.kickmotor.options.fcache.port;
                    if (n === !0)
                        if (m()) {
                            var f = u + "://127.0.0.1:" + a + "/multi_precache_progressForAn23",
                                l = e.kickmotor.nativefn.registerCallback(r);
                            e.kickmotor.nativefn.call("registerProgressDownload", {
                                callback: l
                            })
                        } else var f = u + "://127.0.0.1:" + a + "/multi_precache_progress";
                    else var f = u + "://127.0.0.1:" + a + "/multi_precache";
                    0 < o.length ? g({
                        url: f,
                        type: "POST",
                        data: {
                            url_vers: o.join(","),
                            redirect: i ? "true" : "false",
                            force: s ? "true" : "false"
                        },
                        timeout: e.kickmotor.options.fcache.downloadTimeoutMsec,
                        async: !m()
                    }).done(function(e, i, s) {
                        if (!n || !m()) s.status != 200 ? r(e.responseText, t) : r(null, t)
                    }).fail(function(e, n, i) {
                        e.responseText ? r(e.responseText, t) : r(n, t)
                    }) : r(null, t)
                },
                cache: function(t, n, r) {
                    function l(e) {
                        f = !0, r(e, t, u, a)
                    }

                    function c(t) {
                        var r = e.kickmotor.options.serverStaticContentUrlForCProxy || e.kickmotor.options.serverStaticContentUrl,
                            h = e.kickmotor.options.clientrContentDirectoryPath;
                        h.charAt(0) !== "/" && (h = "/" + h);
                        var p = " " + o[t / 2];
                        if (p.indexOf(" sound:") !== -1) var d = new RegExp(h);
                        else var d = new RegExp("^" + h);
                        var v = o[t / 2].replace(d, r),
                            y = s[t];
                        if (y.substr(0, 4) !== "http") {
                            var b = document.location.origin;
                            b || (b = document.location.protocol + "//" + document.location.host), y = b + "/" + y
                        }
                        g({
                            url: e.kickmotor.options.fcache.protocol + "://127.0.0.1:" + e.kickmotor.options.fcache.port + "/cache",
                            type: "GET",
                            data: {
                                url: v,
                                ver: s[t + 1],
                                download_url: y,
                                precache: "1"
                            },
                            timeout: e.kickmotor.options.fcache.downloadTimeoutMsec,
                            async: !m()
                        }).done(function(e, r, s) {
                            f || (s.status != 200 ? l(e) : (++u, u >= a ? l(null) : (n && n(null, u, a), i && c(t + 2))))
                        }).fail(function() {
                            f || l("CProxy: /cache failed")
                        })
                    }
                    var i = !1,
                        s = D(t),
                        o = Object.keys(t),
                        u = 0,
                        a = s.length / 2,
                        f;
                    if (i) c(0);
                    else
                        for (var h = 0; h < a; ++h) c(h * 2)
                }
            },
            P = {
                precacheBundle: N,
                hasDownloadPrecacheBundle: C,
                precacheBundleProgressive: k,
                getSizeOfBundle: L,
                clear: A,
                deleteFiles: O,
                deleteExpiredFiles: M
            };
        i ? module.exports = P : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.fcache = P)
    }(this.self || global, jQuery),
    function(e) {
        function s(e) {
            i.call("setMobageButtonVisible", {
                visible: e ? "true" : "false"
            })
        }

        function l(e, t) {
            var n = typeof t == "string" ? a[t] : t;
            if (f === e) return;
            f = e, e ? i.call("showBalanceButton", {
                left: n[0],
                top: n[1],
                width: n[2],
                height: n[3]
            }) : i.call("hideBalanceButton")
        }

        function c() {
            return f
        }

        function h(e, t, n, r) {
            var s = typeof t == "string" ? a[t] : t;
            if (f === e) return;
            var o = !0;
            f = e, r = r || "right", e ? i.call("showBalanceLabel", {
                left: s[0],
                top: s[1],
                width: s[2],
                height: s[3],
                red: n[0],
                green: n[1],
                blue: n[2],
                alpha: n[3],
                align: r
            }) : i.call("hideBalanceLabel")
        }

        function p(e) {
            i.call("openExternalURL", {
                url: e
            })
        }

        function d(e, t) {
            var n = i.autoUnregisterCallback(t);
            i.call("canOpenExternalURL", {
                url: e,
                callback: "" + n
            })
        }

        function v(e) {
            var t = i.autoUnregisterCallback(e);
            i.call("getRemoteNotificationsEnabled", {
                callback: t
            })
        }

        function m(e, t) {
            var n = i.autoUnregisterCallback(t);
            i.call("setRemoteNotificationsEnabled", {
                enabled: e,
                callback: n
            })
        }

        function g(t, n, r, s, o) {
            typeof o == "string" ? o = o.toUpperCase() === "POST" ? "POST" : "GET" : o = "GET";
            var u = e.kickmotor.nativefn.autoUnregisterCallback(function(e) {
                s(e.err, e.resultString)
            });
            r = encodeURIComponent(JSON.stringify(r)), i.call("purchaseItem", {
                create_transaction_path: t,
                close_transaction_path: n,
                billing_params: r,
                callback: u,
                method: o
            })
        }

        function y(e) {
            e = e || "", i.call("mobageLogin", {
                path: e
            })
        }

        function b() {
            i.call("mobageLogout")
        }

        function w() {
            i.call("showCommunity")
        }

        function E(t, n) {
            t = typeof t == "string" ? t : "";
            var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
            i.call("sendAdCustomEvent", {
                eventID: t,
                callback: r
            })
        }

        function S(e) {
            e = typeof e == "string" ? e : "MBGADFrameID_A";
            var t = {
                MBGADFrameID_A: 0,
                MBGADFrameID_B: 1,
                MBGADFrameID_C: 2,
                MBGADFrameID_D: 3,
                MBGADFrameID_E: 4,
                MBGADFrameID_F: 5,
                MBGADFrameID_G: 6,
                MBGADFrameID_H: 7,
                MBGADFrameID_I: 8,
                MBGADFrameID_J: 9,
                MBGADFrameID_K: 10,
                MBGADFrameID_L: 11,
                MBGADFrameID_M: 12,
                MBGADFrameID_N: 13,
                MBGADFrameID_O: 14,
                MBGADFrameID_P: 15,
                MBGADFrameID_Q: 16,
                MBGADFrameID_R: 17,
                MBGADFrameID_S: 18,
                MBGADFrameID_T: 19,
                MBGADFrameID_U: 20,
                MBGADFrameID_V: 21,
                MBGADFrameID_W: 22,
                MBGADFrameID_X: 23,
                MBGADFrameID_Y: 24,
                MBGADFrameID_Z: 25
            };
            return t[e]
        }

        function x(t, n, r) {
            t = S(t);
            var s = e.kickmotor.nativefn.autoUnregisterCallback(r);
            n = typeof n == "string" ? n : "bottom", i.call("showAdIconListView", {
                frameID: t,
                position: n,
                callback: s
            })
        }

        function T() {
            i.call("hideAdIconListView")
        }

        function N(t, n) {
            t = S(t);
            var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
            i.call("showAdPopupDialog", {
                frameID: t,
                callback: r
            })
        }

        function C(t, n, r) {
            t = S(t);
            var s = e.kickmotor.nativefn.autoUnregisterCallback(r),
                o = typeof n.title == "string" ? n.title : "Error",
                u = typeof n.networkErrorMessage == "string" ? n.networkErrorMessage : "Network Error",
                a = typeof n.defaultErrorMessage == "string" ? n.defaultErrorMessage : "Unexpected Error";
            i.call("showAdOfferwall", {
                frameID: t,
                title: o,
                networkError: u,
                defaultError: a,
                callback: s
            })
        }

        function k() {
            i.call("mobageLegal")
        }

        function L(t, n, r) {
            var s = e.kickmotor.nativefn.registerCallback(t),
                o = e.kickmotor.nativefn.registerCallback(n),
                u = e.kickmotor.nativefn.autoUnregisterCallback(r);
            i.call("setMobageDashboardListener", {
                onOpenCallback: s,
                onDismissCallback: o,
                onErrorCallback: u
            })
        }

        function A() {
            i.call("resetMobageDashboardListener")
        }

        function O() {
            i.call("openBankDialog")
        }

        function M(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            i.call("getVCBundles", {
                callback: n
            })
        }

        function _(t, n) {
            var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
            i.call("buyVCBundle", {
                sku: t,
                callback: r
            })
        }

        function D(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            i.call("linkAccount", {
                callback: n
            })
        }

        function P(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            i.call("loadAccount", {
                callback: n
            })
        }

        function H(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            i.call("getLanguageSetting", {
                callback: n
            })
        }

        function B(t, n) {
            var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
            i.call("setLanguageSetting", {
                language: t,
                callback: r
            })
        }

        function j(t) {
            if (e.kickmotor.nativefn.getNativeOS() == "android") {
                var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
                i.call("getHardwareAccelerationSetting", {
                    callback: n
                })
            }
        }

        function F(t, n) {
            if (e.kickmotor.nativefn.getNativeOS() == "android") {
                var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
                i.call("setHardwareAccelerationSetting", {
                    hardwareAcceleration: t,
                    callback: r
                })
            }
        }

        function I(e, t, n) {
            i.call("launchMailer", {
                title: e,
                mailContent: t,
                recipient: n
            })
        }

        function q(t, n) {
            e.kickmotor.nativefn.getNativeOS() === "ios" && i.call("saveInSharedMemory", {
                dataKey: t,
                value: n
            })
        }

        function R(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            i.call("getBalance", {
                callback: n
            })
        }

        function U(t, n, r, s) {
            t = t && typeof t == "string" ? t : undefined, n = n && typeof n == "string" ? n : undefined;
            var o = e.kickmotor.nativefn.autoUnregisterCallback(r),
                u = e.kickmotor.nativefn.autoUnregisterCallback(s);
            i.call("openPlayerInviter", {
                message: t,
                imageUrl: n,
                onInvitedCallBack: o,
                onDismissCallback: u
            })
        }

        function z(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            i.call("userInfo", {
                callback: n
            })
        }

        function W(t, n) {
            t = t && typeof t == "string" ? t : undefined;
            var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
            i.call("openInternalWebBrowser", {
                url: t,
                callBack: r
            })
        }

        function X(t) {
            if (e.kickmotor.nativefn.getNativeOS() != "android") {
                t({
                    success: !0,
                    storeType: "apple"
                });
                return
            }
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            i.call("getStoreType", {
                callback: n
            })
        }
        var t = !!e.self,
            n = !!e.WorkerLocation,
            r = !!e.global,
            i = e.kickmotor.nativefn,
            o = 104,
            u = 34,
            a = {
                right_buttom: [209, 439, o, u]
            },
            f = !1,
            V = {
                setMobageButtonVisible: s,
                setBalanceButtonVisible: l,
                getBalanceButtonVisible: c,
                openExternalURL: p,
                canOpenExternalURL: d,
                getRemoteNotificationsEnabled: v,
                setRemoteNotificationsEnabled: m,
                purchaseItem: g,
                mobageLogin: y,
                mobageLogout: b,
                showCommunity: w,
                sendAdCustomEvent: E,
                showAdIconListView: x,
                hideAdIconListView: T,
                showAdPopupDialog: N,
                showAdOfferwall: C,
                mobageLegal: k,
                setMobageDashboardListener: L,
                resetMobageDashboardListener: A,
                showBankDialog: O,
                getVCBundles: M,
                buyVCBundle: _,
                linkAccount: D,
                loadAccount: P,
                getSystemLanguage: H,
                setLanguageSetting: B,
                getHardwareAccelerationSetting: j,
                setHardwareAccelerationSetting: F,
                launchMailer: I,
                saveInSharedMemory: q,
                getBalance: R,
                setBalanceLabelVisible: h,
                openPlayerInviter: U,
                userInfo: z,
                openInternalWebBrowser: W,
                getStoreType: X
            };
        r ? module.exports = V : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.platform = V)
    }(this.self || global, jQuery),
    function(e, t) {
        function o() {
            var e = document.createElement("meta");
            e.name = "viewport";
            var t = navigator.userAgent,
                n = navigator.platform;
            if (t.indexOf("iPad") !== -1 || n.indexOf("iPad") !== -1) e.content = "width=320, height=480, maximum-scale=10, user-scalable=no";
            else if (!t.match(/(iPad|iPhone)/g)) {
                var r = t.lastIndexOf("_android=");
                if (r !== -1) {
                    var i;
                    try {
                        i = JSON.parse(t.substring(r + "_android=".length))
                    } catch (s) {
                        var o = t.substring(r + "_android=".length);
                        i = JSON.parse(o.replace("Infinity", window.devicePixelRatio * .9375))
                    }
                    e.content = "width=device-width, initial-scale=" + i.scale + ", minimum-scale=" + i.scale + ", maximum-scale=" + i.scale + ", target-densitydpi=device-dpi"
                } else e.content = "width=320, initial-scale=1, user-scalable=no"
            } else e.content = "width=device-width, initial-scale=1, user-scalable=no";
            document.getElementsByTagName("head")[0].appendChild(e)
        }
        var n = !!e.self,
            r = !!e.WorkerLocation,
            i = !!e.global,
            s = e.kickmotor.nativefn.call;
        o();
        var u = {
            showGameView: function() {
                s("showGameView")
            },
            redrawWebView: function() {
                s("redrawWebView")
            },
            appendViewport: o
        };
        i ? module.exports = u : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.view = u)
    }(this.self || global, jQuery),
    function(e, t) {
        function s(t, n, r, i) {
            e.kickmotor.fcache.precacheBundle(t, !1, !1, n, r, i)
        }

        function o(t, n) {
            e.kickmotor.fcache.hasDownloadPrecacheBundle(t, n)
        }

        function u(t) {
            var n = e.kickmotor.nativefn.registerCallback(t);
            e.kickmotor.nativefn.call("progressDownloadInit", {
                callback: n
            })
        }

        function a(t, n, r, i) {
            e.kickmotor.fcache.precacheBundle(t, !1, !0, n, r, i)
        }

        function f(t) {
            e.kickmotor.fcache.getSizeOfBundle(t)
        }

        function l(t) {
            e.kickmotor.fcache.deleteFiles(t)
        }

        function c(t) {
            e.kickmotor.fcache.deleteExpiredFiles(t)
        }

        function h(t, n) {
            if (undefined !== n) {
                var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
                t.push({
                    exec: "processAnimationCallback",
                    callback: r
                })
            }
            e.kickmotor.nativefn.call("processAnimation", {
                stream: t
            })
        }

        function p(t) {
            t = typeof t == "number" ? t : 1 / 60, e.kickmotor.nativefn.call("setAnimationInterval", {
                value: t
            })
        }

        function d(t, n, r) {
            t = typeof t == "boolean" ? t : !0, n = typeof n == "number" ? n : 0, r = typeof r == "number" ? r : 0, e.kickmotor.nativefn.call("showNativeInfo", {
                isShow: t,
                x: n,
                y: r
            })
        }

        function v(t) {
            t = typeof t == "boolean" ? t : !0, e.kickmotor.nativefn.call("showTinyNativeInfo", {
                isShow: t
            })
        }

        function m(t) {
            t = typeof t == "number" ? t : 5, e.kickmotor.nativefn.call("setSwaipeSettings", {
                velocity: t
            })
        }

        function g(t) {
            t = typeof t == "boolean" ? t : !0, e.kickmotor.nativefn.call("dumpABInfo", {
                isVisualTree: t
            })
        }

        function y() {
            e.kickmotor.nativefn.call("dumpTexture")
        }

        function b(t) {
            t = typeof t == "boolean" ? t : !1, e.kickmotor.nativefn.call("setKeepJsonCache", {
                isEnable: t
            })
        }

        function w() {
            e.kickmotor.nativefn.call("clearUnusedJsonCache")
        }

        function E(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            e.kickmotor.nativefn.call("getCachedJsonData", {
                callback: n
            })
        }

        function S() {
            e.kickmotor.nativefn.call("dumpCachedJsonData")
        }
        var n = !!e.self,
            r = !!e.WorkerLocation,
            i = !!e.global,
            x = {
                precacheAssets: s,
                isDownloadAssets: o,
                precacheAssetsGetProgress: u,
                precacheAssetsProgressive: a,
                getSizeOfBundle: f,
                processAnimation: h,
                setAnimationInterval: p,
                showNativeInfo: d,
                showTinyNativeInfo: v,
                setSwipeSettings: m,
                dumpABInfo: g,
                dumpTexture: y,
                deleteFiles: l,
                deleteExpiredFiles: c,
                setKeepJsonCache: b,
                clearUnusedJsonCache: w,
                getCachedJsonData: E,
                dumpCachedJsonData: S
            };
        i ? module.exports = x : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.animation = x)
    }(this.self || global, jQuery),
    function(e) {
        var t = !!e.self,
            n = !!e.WorkerLocation,
            r = !!e.global,
            i = {};
        i.openSessionForRead = function(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            e.kickmotor.nativefn.call("facebookOpenSessionForRead", {
                callback: n
            })
        }, i.openSessionForPublish = function(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            e.kickmotor.nativefn.call("facebookOpenSessionForPublish", {
                callback: n
            })
        }, i.sessionIsOpened = function(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            e.kickmotor.nativefn.call("facebookSessionIsOpened", {
                callback: n
            })
        }, i.closeSession = function() {
            e.kickmotor.nativefn.call("facebookCloseSession", {})
        }, i.getAccessToken = function(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            e.kickmotor.nativefn.call("facebookGetAccessToken", {
                callback: n
            })
        }, i.getPermissions = function(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            e.kickmotor.nativefn.call("facebookGetPermissions", {
                callback: n
            })
        }, i.setPermissions = function() {
            e.kickmotor.nativefn.call("facebookSetPermissions", {})
        }, i.getExpirationDate = function(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            e.kickmotor.nativefn.call("facebookGetExpirationDate", {
                callback: n
            })
        }, i.requestDialog = function(t, n) {
            var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
            t.callback = r, e.kickmotor.nativefn.call("facebookRequestDialog", t)
        }, r ? module.exports = i : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.facebook = i)
    }(this.self || global),
    function(e, t) {
        function o(t, n, r, i) {
            typeof i == "undefined" && (i = function() {});
            var o = e.kickmotor.nativefn.autoUnregisterCallback(i);
            s("playMusic", {
                file: t,
                fade: n,
                oneshot: r,
                callback: o
            })
        }

        function u(t, n, r, i) {
            typeof i == "undefined" && (i = function() {});
            var o = e.kickmotor.nativefn.autoUnregisterCallback(i);
            s("playIntroLoop", {
                file: t,
                startLoop: n,
                endLoop: r,
                callback: o
            })
        }

        function a(e) {
            s("stopMusic", {
                fade: e
            })
        }

        function f(e, t) {
            s("playEffect", {
                file: e,
                loop: t
            })
        }

        function l(e) {
            s("stopEffect", {
                file: e
            })
        }

        function c(e) {
            s("preloadEffect", {
                files: e
            })
        }

        function h(e) {
            s("unloadEffect", {
                files: e
            })
        }

        function p() {
            s("pause", {})
        }

        function d() {
            s("resume", {})
        }

        function v(e) {
            s("setBackgroundMusicVolume", {
                volume: e
            })
        }

        function m(e) {
            s("setEffectsVolume", {
                volume: e
            })
        }

        function g(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("getBackgroundMusicVolume", {
                callback: n
            })
        }

        function y(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("getEffectsVolume", {
                callback: n
            })
        }
        var n = !!e.self,
            r = !!e.WorkerLocation,
            i = !!e.global,
            s = e.kickmotor.nativefn.call,
            b = {
                playMusic: o,
                playIntroLoopMusic: u,
                stopMusic: a,
                playEffect: f,
                stopEffect: l,
                preloadEffects: c,
                unloadEffects: h,
                pause: p,
                resume: d,
                setBackgroundMusicVolume: v,
                setEffectsVolume: m,
                getBackgroundMusicVolume: g,
                getEffectsVolume: y
            };
        i ? module.exports = b : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.sound = b)
    }(this.self || global, jQuery),
    function(e, t) {
        function o(e) {
            typeof e == "undefined" && (e = !0), s("exitApplication", {
                doConfirm: e ? "true" : "false"
            })
        }

        function u(e) {
            typeof e == "undefined" && (e = !0), s("finishApplication", {
                doConfirm: e ? "true" : "false"
            })
        }

        function a(e) {
            var t = {};
            for (var n in e) {
                var r = e[n];
                for (var i in r) t[i] = r[i]
            }
            return t
        }

        function f(t, n, r, i) {
            e.kickmotor.nativefn.getNativeOS() === "ios" ? s("callLocalNotification", {
                id: t,
                time: n,
                text: r,
                badgeNumber: 0,
                badgeNumberAfter: 0,
                isRemoveNotify: !0,
                isRemoveAllNotify: !0,
                isRemoveForeground: !1
            }) : s("callLocalNotification", {
                id: t,
                time: n,
                text: r,
                title: i,
                message: r,
                badgeNumber: 0,
                isRemoveNotify: !0,
                isRemoveAllNotify: !0
            })
        }

        function l(e) {
            s("cancelLocalNotification", {
                id: e
            })
        }

        function c(t) {
            e.kickmotor.nativefn.getNativeOS() === "ios" && s("setIconBadgeNumber", {
                number: t
            })
        }

        function h(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("localStorageInit", {
                callback: n
            })
        }

        function p() {
            s("localStorageFree", {})
        }

        function d(t, n, r) {
            var i = e.kickmotor.nativefn.autoUnregisterCallback(r);
            s("localStorageSetItem", {
                key: t,
                value: n,
                callback: i
            })
        }

        function v(t, n) {
            var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
            s("localStorageGetItem", {
                key: t,
                callback: r
            })
        }

        function m(t, n) {
            var r = e.kickmotor.nativefn.autoUnregisterCallback(n);
            s("localStorageRemoveItem", {
                key: t,
                callback: r
            })
        }

        function g(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("localStorageGetAllKeys", {
                callback: n
            })
        }

        function y(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("isNotificationEnable", {
                callback: n
            })
        }

        function b(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("canOpenNotificationSettings", {
                callback: n
            })
        }

        function w() {
            s("openNotificationSettings", {})
        }

        function E(t, n) {
            var r = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("zip", {
                callback: r,
                source: n
            })
        }

        function S(t, n) {
            var r = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("unzip", {
                callback: r,
                source: n
            })
        }
        var n = !!e.self,
            r = !!e.WorkerLocation,
            i = !!e.global,
            s = e.kickmotor.nativefn.call,
            x = {
                exitApplication: o,
                finishApplication: u,
                makeAssetList: a,
                callLocalNotification: f,
                cancelLocalNotification: l,
                setIconBadgeNumber: c,
                localStorageInit: h,
                localStorageFree: p,
                localStorageSetItem: d,
                localStorageGetItem: v,
                localStorageRemoveItem: m,
                localStorageGetAllKeys: g,
                isNotificationEnable: y,
                canOpenNotificationSettings: b,
                openNotificationSettings: w,
                zip: E,
                unzip: S
            };
        i ? module.exports = x : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.util = x)
    }(this.self || global, jQuery),
    function(e) {
        function i() {
            var e = navigator.userAgent,
                t = e.match(/Android\s([0-9\.]*)/);
            return t ? t[1] : !1
        }

        function o() {
            function r(e, i) {
                var s = this;
                this._callbackIds = n.reduce(function(e, n) {
                    return e[n] = t.registerCallback(s["_" + n].bind(s), {}), e
                }, {}), t.call("websocket", {
                    event: "open",
                    url: e,
                    id: this._callbackIds.onopen,
                    ids: this._callbackIds,
                    mo: undefined !== i ? i : !1
                }), this.url = e, this.readyState = r.CONNECTING
            }
            var t = e.kickmotor.nativefn,
                n = ["onopen", "onerror", "onclose", "onmessage"];
            return r.CONNECTING = 0, r.OPEN = 1, r.CLOSING = 2, r.CLOSED = 3, r.prototype._onopen = function() {
                this.readyState = r.OPEN, this.onopen && this.onopen.apply(this, arguments)
            }, r.prototype._onerror = function() {
                this.onerror && this.onerror.apply(this, arguments)
            }, r.prototype._onmessage = function() {
                this.onmessage && this.onmessage.apply(this, arguments)
            }, r.prototype._onclose = function() {
                this.readyState = r.CLOSED;
                var e = this;
                n.forEach(function(n) {
                    t.unregisterCallback(e._callbackIds[n])
                }), this.onclose && this.onclose.apply(this, arguments)
            }, r.prototype.send = function(e) {
                t.call("websocket", {
                    event: "send",
                    id: this._callbackIds.onopen,
                    data: e
                })
            }, r.prototype.close = function() {
                this.readyState = r.CLOSING, t.call("websocket", {
                    event: "close",
                    id: this._callbackIds.onopen
                })
            }, r
        }
        var t = !!e.self,
            n = !!e.WorkerLocation,
            r = !!e.global,
            s = o();
        r ? module.exports = s : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.WebSocket = s)
    }(this.self || global),
    function(e, t) {
        function o(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("signInGPGService", {
                callback: n
            })
        }

        function u() {
            s("signOutGPGService", {})
        }

        function a(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("isConnectedGPGService", {
                callback: n
            })
        }

        function f() {
            s("openAchievementUIGPGService", {})
        }

        function l(e) {
            s("unlockAchievementGPGService", {
                id: e
            })
        }

        function c(e, t) {
            s("incrementAchievementGPGService", {
                id: e,
                numSteps: t
            })
        }

        function h() {
            s("openAllLeaderboardsUIGPGService", {})
        }

        function p(e) {
            s("openLeaderboardUIGPGService", {
                id: e
            })
        }

        function d(e, t) {
            s("submitScoreGPGService", {
                id: e,
                score: t
            })
        }
        var n = !!e.self,
            r = !!e.WorkerLocation,
            i = !!e.global,
            s = e.kickmotor.nativefn.call,
            v = {
                signIn: o,
                signOut: u,
                isConnected: a,
                openAchievementUI: f,
                unlockAchievement: l,
                incrementAchievement: c,
                openAllLeaderboardsUI: h,
                openLeaderboardUI: p,
                submitScore: d
            };
        i ? module.exports = v : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.googleplaygame = v)
    }(this.self || global, jQuery),
    function(e, t) {
        function o(e, t, n, r) {
            typeof e == "string" && typeof t == "string" && (n = typeof n == "string" ? n : "", r = typeof r == "number" ? r : 0, s("sendCreateEvent", {
                category: e,
                action: t,
                label: n,
                value: r
            }))
        }

        function u(e) {
            typeof e == "string" && s("sendScreenName", {
                name: e
            })
        }

        function a(e) {
            typeof e == "number" && (e = e < 0 ? 0 : e > 100 ? 100 : e, s("setSampleRate", {
                rate: e
            }))
        }
        var n = !!e.self,
            r = !!e.WorkerLocation,
            i = !!e.global,
            s = e.kickmotor.nativefn.call,
            f = {
                sendCreateEvent: o,
                sendScreenName: u,
                setSampleRate: a
            };
        i ? module.exports = f : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.googleanalytics = f)
    }(this.self || global, jQuery),
    function(e, t) {
        function o(t) {
            if (e.kickmotor.nativefn.getNativeOS() !== "ios") {
                t({
                    enabled: !1
                });
                return
            }
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            s("checkiOS8Share", {
                callback: n
            })
        }

        function u(t, n, r) {
            var i = e.kickmotor.nativefn.autoUnregisterCallback(n);
            s("startiOS8Share", {
                message: t,
                callback: i,
                hideScreenshot: r === !0 ? "true" : "false"
            })
        }

        function a(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            if (e.kickmotor.nativefn.getNativeOS() === "ios") {
                s("signInGameCenterService", {
                    callback: n
                });
                return
            }
        }

        function f(t) {
            if (e.kickmotor.nativefn.getNativeOS() === "ios") {
                s("unlockAchievementGameCenterService", {
                    id: t
                });
                return
            }
        }

        function l(t) {
            var n = e.kickmotor.nativefn.autoUnregisterCallback(t);
            if (e.kickmotor.nativefn.getNativeOS() === "ios") {
                s("resetAchievementGameCenterService", {
                    callback: n
                });
                return
            }
        }
        var n = !!e.self,
            r = !!e.WorkerLocation,
            i = !!e.global,
            s = e.kickmotor.nativefn.call,
            c = {
                checkiOS8Share: o,
                startiOS8Share: u,
                signIn: a,
                unlockAchievement: f,
                resetAchievementAll: l
            };
        i ? module.exports = c : (typeof e.kickmotor == "undefined" && (e.kickmotor = {}), e.kickmotor.iosgamecenter = c)
    }(this.self || global, jQuery), define("kickmotor", ["logger"], function(e) {
        return function() {
            var t, n;
            return t || e.kickmotor
        }
    }(this)),
    function(e, t) {
        var n = e.FF.env = e.FF.env || {};
        e.FFEnv = e.FFEnv || {}, n.isDevelop = function() {
            return e.FFEnv.modeName === "development" && !e.FFEnv.isPseudoProdutionEnabled ? !0 : !1
        }, n.isNewClient = function() {
            return e.FFEnv.isNewClient ? !0 : !1
        }, n.isTutorial = function() {
            return e.FFEnv.isTutorial ? !0 : !1
        }, n.isNative = function() {
            return e.kickmotor && e.kickmotor.nativefn && e.kickmotor.nativefn.isNative()
        }, n.isIOS = function() {
            return e.kickmotor && e.kickmotor.nativefn && e.kickmotor.nativefn.getNativeOS() === "ios"
        }, n.isAndroid = function() {
            return e.kickmotor && e.kickmotor.nativefn && e.kickmotor.nativefn.getNativeOS() === "android"
        }, n.isWWRegion = function() {
            return n.getLanguage() !== null
        }, n.isUsingWWBackKeyHandler = function() {
            return n.isWWRegion()
        }, n.isUsingTodayWidget = function() {
            return n.isWWRegion()
        }, n.isShowingCharacterProfiles = function() {
            return n.isWWRegion()
        }, n.isShowingMobageLegal = function() {
            return !n.isWWRegion()
        }, n.regionTimeZoneOffset = function() {
            return n.isWWRegion() ? -28800 : 32400
        }, n.getLanguage = function() {
            var t = "ja";
            if (e.kickmotor) {
                var n = e.kickmotor.nativefn.getLanguageSetting();
                n && (n === "en" || n === "fr" || n === "es") && (t = n)
            }
            return t
        }, n.getWikiUrl = function() {
            var e = n.getLanguage();
            return e === "en" ? "https://ffrkstrategy.gamematome.jp/game/951/wiki/Home" : e === "fr" ? "https://ffrkstrategy-fr.gamematome.jp/game/952/wiki/Accueil" : e === "es" ? "https://ffrkstrategy-es.gamematome.jp/game/953/wiki/Inicio" : "http://sp.mbga.jp/_from_app?game_id=12019103"
        }, n.isWWRegion = function() {
            return n.getLanguage() !== "ja"
        }, n.isUsingWWBackKeyHandler = function() {
            return n.isWWRegion()
        }, n.isUsingTodayWidget = function() {
            return n.isWWRegion()
        }, n.isShowingMobageLegal = function() {
            return !n.isWWRegion()
        }, n.canUseDealSound = function() {
            return e.FFEnv.canUseDealSound ? !0 : !1
        }, n.isIOS6_x = function() {
            return n.isIOS() && -1 < navigator.userAgent.indexOf("OS 6_")
        }, n.isIOS6_0 = function() {
            return n.isIOS() && -1 < navigator.userAgent.indexOf("OS 6_0")
        }, n.isIOS7_x = function() {
            return n.isIOS() && -1 < navigator.userAgent.indexOf("OS 7_")
        }, n.isIOS7_0 = function() {
            return n.isIOS() && -1 < navigator.userAgent.indexOf("OS 7_0")
        }, n.isAndroid2_x = function() {
            return n.isAndroid() && -1 < navigator.userAgent.indexOf("Android 2.")
        }, n.isAndroid2_3 = function() {
            return n.isAndroid() && -1 < navigator.userAgent.indexOf("Android 2.3")
        }, n.isAndroid4_0 = function() {
            return n.isAndroid() && -1 < navigator.userAgent.indexOf("Android 4.0")
        }, n.isAndroid4_4 = function() {
            return n.isAndroid() && -1 < navigator.userAgent.indexOf("Android 4.4")
        }, n.getAndroidVersion = function() {
            if (!n.isAndroid()) return;
            var e = navigator.userAgent.split(" Android ")[1].split(";")[0].split("."),
                r = +e[0],
                i = isNaN(+e[1]) ? t : +e[1],
                s = isNaN(+e[2]) ? t : +e[2];
            return {
                major: r,
                minor: i,
                micro: s
            }
        }, n.getMinimumIOS = function() {
            return n.isWWRegion() ? 7 : 6
        }, n.getIOSVersion = function() {
            if (!n.isIOS()) return;
            var e = navigator.userAgent.match(/OS ([0-9]*_[0-9]*(_[0-9]*)?)/)[1].split("_"),
                r = isNaN(+e[0]) ? n.getMinimumIOS() : +e[0],
                i = isNaN(+e[1]) ? t : +e[1],
                s = isNaN(+e[2]) ? t : +e[2];
            return {
                major: r,
                minor: i,
                micro: s
            }
        }, n.isIOS8CompatibleVersion = function() {
            if (!n.isIOS()) return !1;
            var e = navigator.userAgent.split(" OS ")[1].split("")[0].split("_");
            return +e[0] >= 8 ? !0 : !1
        }, n.isIOSVersionGreaterThanOrEqualTo = function(e, t, r) {
            if (!n.isIOS()) return !1;
            var i = n.getIOSVersion();
            return n._isVersionGreaterThanOrEqualTo(i, e, t, r)
        }, n.isAndroidVersionGreaterThanOrEqualTo = function(e, t, r) {
            if (!n.isAndroid()) return !1;
            var i = n.getAndroidVersion();
            return n._isVersionGreaterThanOrEqualTo(i, e, t, r)
        }, n._isVersionGreaterThanOrEqualTo = function(e, n, r, i) {
            var s = !1;
            return n < e.major ? s = !0 : n === e.major ? r === t && e.minor === t ? s = !0 : 0 <= e.minor && r === t || 0 <= e.minor && r < e.minor ? s = !0 : r === e.minor ? i === t && e.micro === t ? s = !0 : 0 <= e.micro && i === t || 0 <= e.micro && i <= e.micro ? s = !0 : s = !1 : s = !1 : s = !1, s
        }, n.isAnimationAvailable = function() {
            return n.isAnimationAvailableCalculatedValue === t && (n.isAnimationAvailableCalculatedValue = !n.isIOS6_x() && !n.isAndroid2_x()), n.isAnimationAvailableCalculatedValue
        }, n.canPlayMovieJustAfterDownload = function() {
            return n.isAndroid2_3() ? !1 : !0
        }, n.checkMobageLoginDeferred = function() {
            var t = $.Deferred();
            return e.kickmotor ? (e.kickmotor.nativefn.clientInfo(function(e) {
                t.resolve(e.login)
            }), t.promise()) : t.resolve().promise()
        }, n.csrfToken = FFEnv.csrfToken, n.userId = FFEnv.userId, n.userSessionKey = FFEnv.userSessionKey, n.appJsVersion = FFEnv.appJsVersion, n.nickname = FFEnv.nickname, n.isOptimized = FFEnv.isOptimized, n.offsetFromUTC = FFEnv.offsetFromUTC, n.staticDir = FFEnv.staticDir, n.framesPerSecond = 30, n.versionInfo = FFEnv.versionInfo, n.calcServerTimeDiffMsec = function(e) {
            return e * 1e3 - (new Date).getTime()
        }, n.serverTimeDiffMsec = n.calcServerTimeDiffMsec(FFEnv.serverTime), n.a = "leen1ge7ahvah9ahb0Shi5Oj6aik8xah", n.b = "aeWahchu7quahJ3ba0iekie0zeeh9neu", n.c = "Tah9cieg8eez1ezu0ae5xahZa7Ieb0oz", n.d = "UBKCt6fyWCiNhDmP4kPHrQ58KbAQBFcX", n.e = "Rs6AjA2MMyUaT9EiJTc7G2HzcSSNUHSk", n.f = "bjNKcBi3Ay3A5j8CZnzpK4HWzcBKgbGw", n.g = "daa98255cd97417561b8abe037a56689"
    }(this.self || global, void 0), define("env", function() {}), define("util", ["jquery", "sprintf"], function(e, t) {
        var n = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            r = {
                random: function() {
                    return Math.random()
                },
                randomInt: function(e, t) {
                    return t = t || 0, Math.floor(this.random() * (e - t + 1)) + t
                },
                randomString: function(e) {
                    var t = "",
                        r = n.length;
                    for (var i = 0; i < e; i++) t += "" + n.charAt(this.randomInt(r - 1));
                    return t
                },
                sum: function(e) {
                    var t = 0;
                    return _.each(e, function(e) {
                        e = e || 0, t += e
                    }), t
                },
                lot: function(e, t, n) {
                    n = n || {};
                    var r = _.map(e, function(e, n) {
                            return t(e, n)
                        }),
                        i = this.sum(r);
                    if (i <= 0) throw new Error("lot blank");
                    var s = this.randomInt(i - 1),
                        o = 0;
                    return _.each(r, function(e) {
                        return e = e || 0, s -= e, s < 0 ? !1 : (o++, !1)
                    }), n.returnIndex ? o : e[o]
                },
                lotByFraction: function(e, t) {
                    e = e || 0, t = t || 100;
                    var n = this.randomInt(t - 1);
                    return n < e
                },
                lotByProb: function(e) {
                    var t = this.random();
                    return t < e
                },
                option: function(e, t) {
                    t = t || {};
                    var n = {};
                    return _.each(e, function(e, r) {
                        n[r] = _.isUndefined(t[r]) ? e : t[r]
                    }), n
                },
                getTime: function() {
                    var e = (new Date).getTime(),
                        t = FF.env.serverTimeDiffMsec || 0;
                    return e + t
                },
                getCurrentDay: function() {
                    var e = this.getTime(),
                        t = FF.env.offsetFromUTC * 1e3;
                    return e += t, (new Date(e)).getUTCDay()
                },
                getTimeAsSec: function() {
                    var e = this.getTime();
                    return Math.round(e / 1e3)
                },
                convertYMDHmSToEpochSec: function(e, t, n, r, i, s) {
                    t -= 1;
                    var o = (new Date(e, t, n, r, i, s)).getTime();
                    return Math.round(o / 1e3)
                },
                secondToDDHHMM: function(e, n) {
                    FF.env.isWWRegion() ? FF.env.getLanguage() == "fr" ? n = n || "%sj %sh %sm" : n = n || "%sd %sh %sm" : n = n || "%sæ—¥%sæ™‚é–“%såˆ†";
                    var r = e,
                        i = Math.floor(r / 86400);
                    r %= 86400;
                    var s = Math.floor(r / 3600);
                    r %= 3600;
                    var o = Math.floor(r / 60);
                    return i < 10 && (i = "0" + i), s < 10 && (s = "0" + s), o < 10 && (o = "0" + o), t(n, i, s, o)
                },
                cloneDeep: function(t) {
                    return _.isArray(t) ? e.extend(!0, [], t) : e.extend(!0, {}, t)
                },
                snakecase: function(e) {
                    return e.match(/^[A-Z]+(_[A-Z]+)*$/) ? e : e.replace(/[A-Z]/g, function(e, t) {
                        return t ? "_" + e.toLowerCase() : e.toLowerCase()
                    })
                },
                camelize: function(e, t) {
                    return t = t || {}, t.forceLower && (e = e.toLowerCase()), e.match(/^[A-Z]+(_[A-Z]+)*$/) ? e : e.replace(/_./g, function(e) {
                        return e.charAt(1).toUpperCase()
                    })
                },
                camelizeDeep: function(e) {
                    var t = 0,
                        n = 0,
                        i = void 0,
                        s = void 0;
                    if (_.isArray(e)) {
                        s = [];
                        for (t = 0, n = e.length; t < n; t++) s[t] = this.camelizeDeep(e[t]);
                        return s
                    }
                    if (_.isObject(e)) {
                        s = {}, i = _.keys(e);
                        for (t = 0, n = i.length; t < n; t++) s[r.camelize(i[t])] = this.camelizeDeep(e[i[t]]);
                        return s
                    }
                    return e
                },
                ucamelize: function(e, t) {
                    return this.camelize("_" + e, {
                        forceLower: t
                    })
                },
                nl2br: function(e) {
                    return (e + "").replace(/(\r\n|\r|\n)/g, "<br>")
                },
                assignText: function(t, n) {
                    return _.template(e.trim(e(t).text()), n)
                },
                validateTmplPath: function(e) {
                    if (e.match(/(\.\.|\/\/)/)) throw new Error("invalid path " + e)
                },
                makeInterceptor: function(e, t) {
                    _.isArray(t) || (t = [t]);
                    var n = _.bind(t[t.length - 1], e);
                    for (var r = t.length - 2; r >= 0; r--) n = _.bind(t[r], e, n);
                    return n
                },
                reverseObj: function(e) {
                    var t = {};
                    if (!_.isObject(e)) throw new Error("input value is not Object");
                    return _.each(e, function(e, n) {
                        _.isNumber(e) && (e = e.toString());
                        if (!_.isString(e)) throw new Error("Object value is not String");
                        if (!_.isUndefined(t[e])) throw new Error("key(" + e + ") already exists");
                        t[e] = n
                    }), t
                }
            };
        return FF.redirect = function(t, n) {
            n = _.extend({
                timestamp: r.getTimeAsSec()
            }, n);
            var i = t.split("#")[0],
                s = t.split("#")[1],
                o = i + "?" + e.param(n);
            s && (o = o + "#" + s), location.href = o
        }, r
    });