"use strict";

var express = require("express"),

    serveStatic = require("serve-static");



module.exports = function(config) {
    var app = express();

    app.use(require("express-bunyan-logger")({
	name: "boomerang-express-web",
	immediate: true,
	parseUA: false,
	serializers: {
	    req: function (req) {
		return {
		    method: req.method,
		    headers: req.headers
		};
	    },
	    res: function () { return null; },
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
