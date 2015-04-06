"use strict";

var express = require("express"),
    base = require("../base"),
    cookieParser = require("cookie-parser"),
    bodyParser = require("body-parser"),
    parse = require("url").parse,
    ua = require("useragent");

var Boomerang = function(options, backend, filter, logger) {
    base.call(this, logger);

    this.filter = filter;
    this.backend = backend;
    this.config = options;
};

Boomerang.prototype.uaParser = function  (req, res, next){
    req.agent = ua.parse(req.headers["user-agent"] || "");
    next();
};

Boomerang.prototype.router = function() {
    var router = express.Router();

    var body = bodyParser.urlencoded({ extended: true, inflate: true, reviver: true});
    var cookie = cookieParser();

    var parser = bodyParser.urlencoded({ strict: false,
					 extended: true,
					 inflate: true,
					 reviver: true,
					 type: "text/plain"});

    router.get("/:type/:user/:collection/:page/:state", cookie, body, this.uaParser, this.beacon.bind(this, "GET"));
    router.post("/:type/:user/:collection/:page/:state", cookie, body, this.uaParser, parser, this.beacon.bind(this, "POST"));

    return router;
};

Boomerang.prototype.beacon = function(type, req, res) {
    res.set("X-Powered-By", "NoTool");
    res.set("content-type", "image/png");
    res.status(200).end();

    var beaconData = {};
    if (type === "POST") {
	beaconData = JSON.parse(req.body.data);

    } else if (type === "GET") {
	beaconData = req.query;
    } else {
	return null;
    }

    this.log.debug({ route: req.route }, "Request used params: " + req.params.page + ", " + req.params.state);

    var beacon = {
	type: req.params.type,
	user: req.params.user,
	collection: req.params.collection,
	referrer: parse(req.get("referer") || ""),
	headers: req.headers,
	route: { page: req.params.page, state: req.params.state },
	ip: req.ip,
	agent: req.agent,
	cookies: req.cookies
    };

    this.feed(beacon, beaconData);
    return null;
};

Boomerang.prototype.feed = function(beacon, beaconData) {
    this.backend.exists(beacon.type, beacon.user, beacon.collection, beacon.referrer, function(exists) {
	if (exists) {
	    this.filter.serialize(beaconData, beacon.headers, beacon.route, beacon.ip, beacon.agent, beacon.cookies, function(data) {
		var restiming;
		if (typeof data.restiming !== "undefined") {
		    restiming = data.restiming;
		    delete data.restiming;
		}

		this.store(beacon.type, beacon.user, beacon.collection, data, function(oid) {
		    if (typeof restiming !== "undefined") {
			this.restiming(oid, restiming, beacon.user, beacon.collection);
		    }
		}.bind(this));

	    }.bind(this));
	}
    }.bind(this));
    return null;
};

// type, user, collection, data
Boomerang.prototype.store = function() {
    this.backend.insert.apply(this.backend, arguments);
};

Boomerang.prototype.restiming = function(oid, restiming, user, collection) {
    restiming.forEach(function(timing) {
	timing.refer = oid;
	this.store("resource", user, collection, this.filter.inflate(timing), function() { });
    }, this);
};

module.exports = Boomerang;
