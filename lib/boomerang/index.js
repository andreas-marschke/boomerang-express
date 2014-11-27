"use strict";

var express = require("express"),
    base = require("../base"),
    bodyParser = require("body-parser"),
    parse = require("url").parse;

//     res.ds.once( req.params.type + "Inserted", function(result){
// 	if (typeof res.restiming !== "undefined" ) {
// 	    res.restiming.forEach(function(resource) {
// 		resource.refer = res.ds.toOID(((typeof result["_id"] === "undefined") ? result["id"] : result._id));
// 		res.ds.insert("resource", req.params.user, req.params.collection, parse(req.get("referer") || ""), resource);


var Boomerang = function(options, backend, filter, logger) {
    base.call(this, logger);

    this.filter = filter;
    this.backend = backend;
    this.config = options;
};

Boomerang.prototype.router = function() {
    var router = express.Router();
    var parser = bodyParser.urlencoded({ strict: false,
					 extended: true,
					 inflate: true,
					 reviver: true,
					 type: "text/plain"});

    router.get("/:type/:user/:collection/:page/:state", this.beacon.bind(this, "GET"));
    router.post("/:type/:user/:collection/:page/:state", parser, this.beacon.bind(this, "POST"));

    return router;
};

Boomerang.prototype.beacon = function(type, req, res, next) {
    res.set("content-type", "image/*");
    res.sendStatus(200);
    next();

    var beaconData = {};
    if (type === "POST") {
	beaconData = JSON.parse(req.body.data);

    } else if (type === "GET") {
	beaconData = req.query;
    } else {
	return null;
    }
    var beacon = {
	type: req.params.type,
	user: req.params.user,
	collection: req.params.collection,
	referrer: parse(req.get("referer") || ""),
	headers: req.headers,
	route: req.route,
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
	    this.filter.munge(beaconData, beacon.headers, beacon.route, beacon.ip, beacon.agent, beacon.cookies, function(data) {
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
}

Boomerang.prototype.store = function(type, user, collection, data) {
    this.backend.insert.apply(this.backend, arguments);
};

Boomerang.prototype.restiming = function(oid ,restiming, user, collection) {
    restiming.forEach(function(timing) {
	timing.refer = oid;

	this.store("resource", user, collection, this.filter.inflate(timing), function() { });


    }, this);
};

module.exports = Boomerang;
