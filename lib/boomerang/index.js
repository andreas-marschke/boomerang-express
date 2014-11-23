"use strict";

var express = require("express"),
    parse = require("url").parse;

var app = module.exports = express();

app.use(function(req, res, next) {

    res.insert = function () {
	res.log.info({ restiming: "" + typeof(req.data.restiming) }, "Check if restiming...");
	if (typeof req.data.restiming !== "undefined") {
	    res.restiming = req.data.restiming;
	    delete  req.data.restiming;
	}

	res.ds.insert(req.params.type, req.params.user, req.params.collection, parse(req.get("referer") || ""), req.data);

    };

    res.ds.once( req.params.type + "Inserted", function(result){
	if (typeof res.restiming !== "undefined" ) {
	    res.restiming.forEach(function(resource) {
		/* eslint-disable dot-notation, no-underscore-dangle */
		resource.refer = res.ds.toOID(((typeof result["_id"] === "undefined") ? result["id"] : result._id));
		res.ds.insert("resource", req.params.user, req.params.collection, parse(req.get("referer") || ""), resource);
	    });
	}
    });

    next();
});
