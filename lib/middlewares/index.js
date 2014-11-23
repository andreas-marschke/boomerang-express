"use strict";

var express = require("express"),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    ua = require("useragent"),
    serveStatic = require("serve-static");

var poweredBy = require("helmet").hidePoweredBy();

var app = express();

function uaParser (req, res, next){
    req.agent = ua.parse(req.headers["user-agent"] || "");
    next();
}

var body = bodyParser.urlencoded({ extended: true, inflate: true, reviver: true});

var cookie = cookieParser();

module.exports = function(config) {
    app.disable("x-powered-by");
    app.use(poweredBy);
    app.use(uaParser);
    app.use(body);
    app.use(cookie);

    app.use(require("express-bunyan-logger")({
	name: "boomerang-express-web",
	immediate: false,
	parseUA: true,
	serializers: {
	    req: function (req) {
		return {
		    method: req.method,
		    headers: req.headers
		};
	    },
	    res: function () {
		return null;
	    },
	    "user-agent": function (ua) {
		return {
		    browser: ua.family,
		    version: [ua.major, ua.minor, ua.patch].join("."),
		    device: ua.device.family,
		    os: ua.os.family
		};
	    },
	    body: function () { return null; },
	    "req-headers": function () { return null; }
	},
	streams: [{
	    stream: process.stdout,
	    level: config.log.web.level || "info"
	}]
    }));


    if (typeof config.server.static_path !== "undefined") {
	app.use(serveStatic(config.server.static_path, {
	    dotfiles: "deny",
	    etag: true,
	    extensions: false,
	    setHeaders: function(res) {
		res.setHeader("cache-control", "private, max-age=0, no-cache, no-store, no-transform");
	    }
	}));
    }

    return app;
};
