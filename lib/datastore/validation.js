"use strict";
var urlParse = require("url").parse;

module.exports.collectionName = function(collection, webcollection) {
    this.log.debug({ webcollectionName: webcollection.name, givenName: collection },
		   "Matching webcollection.name: " + webcollection.name + ", and given collection: " + collection );

    return webcollection.name === collection;
};

module.exports.types = function(type, webcollection) {
    this.log.debug({ storedTypes: webcollection.types, givenType: type },
		   "Matching webcollection types: " + JSON.stringify(webcollection.types) + " against given type: " + type);

    return webcollection.types.filter(function(collectiontype) {
	return type === collectiontype;
    }).length > 0;
};

module.exports.location = function(referrer, location) {
    this.log.debug("Trying to match parsed referrer");

    if (location.shared) {

    } else {
	var parsed = urlParse(location.url);
	var score = 0;

	if (parsed.hostname === referrer.hostname) {
	    score += 1;
	}

	if (parsed.host === referrer.host) {
	    score += 1;
	}

	if (parsed.path.indexOf(referrer.path) > -1){
	    score += 1;
	}

	return score > 0;
    }
    return false;
};
