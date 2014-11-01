var express = require('express'),
    app = module.exports = express(),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    cookieSession =  require("cookie-session");

app.use(bodyParser.urlencoded({ extended: true, inflate: true, reviver: true}));


app.use(cookieParser('boomerangexpress'));
app.use(cookieSession({
    name: "boomerangexpress",
    key: "boomerangexpress",
    keys: ["boomerangexpress"],
    secret: "boomerangexpress"
}));


app.use(require('express-bunyan-logger')({
    name: "boomerang-express",
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
