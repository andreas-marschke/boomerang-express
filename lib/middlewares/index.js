var express = require('express'),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    cookieSession =  require("cookie-session"),
    ua = require('useragent'),
    serve_static = require('serve-static');

function lowerCase(str) {
    return str
        .toLowerCase()
        .replace(/ +/g, '-');
}

module.exports = function(config,app) {

    app.disable("x-powered-by");

    app.use(function(req, res, next){
	req.agent = ua.parse(req.headers['user-agent'] || '');
        next();
    });

    app.use(bodyParser.urlencoded({ extended: true, inflate: true, reviver: true}));

    app.use(cookieParser('boomerangexpress'));

    app.use(cookieSession({
	name: "boomerangexpress",
	key: "boomerangexpress",
	keys: ["boomerangexpress"],
	secret: "boomerangexpress"
    }));

    app.use(require('express-bunyan-logger')({
	name: "boomerang-express-web",
	immediate: false,
	parseUA: true,
	serializers: {
	    req: function (req) {
		return {
		    method: req.method,
		    url: req.url,
		    headers: req.headers
		};
	    },
	    res: function () {
		return null;
	    },
	    "user-agent": function (ua) {
		return {
		    browser: ua.family,
		    version: [ua.major,ua.minor,ua.patch].join("."),
		    device: ua.device.family,
		    os: ua.os.family
		};
	    },
	    body: function () { return null; },
	    "req-headers":  function () { return null; }
	},
	streams: [{
	    stream: process.stdout,
	    level: 'info'
	}]
    }));

    app.use(serve_static(config.server.static_path,{
	dotfiles: 'deny',
	etag: true,
	extensions: false,
	setHeaders: function(res,path) {
	    res.setHeader('cache-control', 'private, max-age=0, no-cache, no-store, no-transform');
	}
    }));
};
