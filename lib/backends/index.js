var util = require("util");

var Datastore = module.exports = function (options,logger) {
    if (typeof(options.active) === "string" ) {
	var config = options[options.active];
	var Backend = require ("./" + options.active + "/index.js");
	return new Backend(config, logger);
    }
}


