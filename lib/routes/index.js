var express = require('express'),
    app = module.exports = express(),
    bodyParser = require('body-parser'),
    url = require("url"),
    parser = bodyParser.urlencoded({ strict: false,
				     extended: true,
				     inflate: true,
				     reviver: true,
				     type: "text/plain"});;

function insertBeacon(req,res) {

    var restiming;
    if (typeof req.data.restiming !== "undefined") {
	restiming = req.data.restiming;
	delete  req.data.restiming;
    }

    app.parent.settings.ds.insert(req.params.type,
				  req.params.user,
				  req.params.collection,
				  url.parse(req.get('referer')),
				  req.data);

    app.parent.settings.ds.once( req.params.type +"Inserted",function(id) {
	if (typeof restiming !== "undefined" ) {
	    restiming.forEach(function(resource) {
		resource.refer = app.parent.settings.ds.toOID(id);

		app.parent.settings.ds.insert("resource",
					      req.params.user,
					      req.params.collection,
					      url.parse(req.get('referer')),
					      resource);
	    });
	} else {
	    return;
	}
    });
};

// /beacon/deadb33f/boomerang-manager/start/index?data=collected
app.get("/:type/:user/:collection/:page/:state", function(req, res, next){
    res.type('png');
    res.send(0);

    req.data = app.parent.settings.filter.munge(req.query,
						req.headers,
						req.params,
						req.ip,
						req.agent,
						req.cookies);

    next();
});

app.post("/:type/:user/:collection/:page/:state", parser, function(req, res, next){
    res.type('png');
    res.send(0);

    req.data = app.parent.settings.filter.munge(JSON.parse(req.body.data),
						req.headers,
						req.params,
						req.ip,
						req.agent,
						req.cookies);

    next();
});

app.all("/:type/:user/:collection/:page/:state", insertBeacon );

app.get('*',function(req,res){
    res.redirect('back');
});
