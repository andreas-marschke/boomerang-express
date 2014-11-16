var express = require("express"),
    bodyParser = require("body-parser");


var parser = bodyParser.urlencoded({ strict: false,
				     extended: true,
				     inflate: true,
				     reviver: true,
				     type: "text/plain"});

var app = module.exports = express();

app.get("/:type/:user/:collection/:page/:state", function(req, res) {
    res.sendStatus(200);

    req.data = res.filter.munge(req.query,
				req.headers,
				req.params,
				req.ip,
				req.agent,
				req.cookies);
    res.insert();
});

app.post("/:type/:user/:collection/:page/:state", parser, function(req, res) {
    res.sendStatus(200);

    req.data = res.filter.munge(JSON.parse(req.body.data),
				req.headers,
				req.params,
				req.ip,
				req.agent,
				req.cookies);

    res.insert();
});
