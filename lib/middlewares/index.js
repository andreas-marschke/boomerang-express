"use strict";

var express = require("express"),

    serveStatic = require("serve-static");

module.exports = function(config) {

    var app = express();

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
