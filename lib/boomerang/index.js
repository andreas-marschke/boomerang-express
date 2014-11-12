var express = require("express"),
    parse = require("url").parse;

var app = module.exports = express();

app.use(function(req, res, next) {

    next();

    res.insert = function () {

	res.log.debug("Called on Req-Id: " + req.id);

	var restiming;

	res.log.info({ restiming: typeof(req.data.restiming) }, "Check if restiming...");
	if (typeof req.data.restiming !== "undefined") {
	    restiming = req.data.restiming;
	    delete  req.data.restiming;
	}

	res.ds.insert(req.params.type, req.params.user, req.params.collection, parse(req.get("referer") || ""), req.data);

	res.ds.on( req.params.type + "Inserted", function(result){
	    if (typeof restiming !== "undefined" ) {

		restiming.forEach(function(resource) {

		    resource.refer = res.ds.toOID(result._id);
		    res.ds.insert("resource",
				  req.params.user,
				  req.params.collection,
				  parse(req.get("referer") || ""),
				  resource);
		});
	    } else {
		return null;
	    }
	});
    };

});
