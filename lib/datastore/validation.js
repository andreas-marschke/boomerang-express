"use strict";
var urlParse = require("url").parse;

module.exports.collectionName = function(collection, webcollection) {
    this.log.debug({ webcollectionName: webcollection.name, givenName: collection },
		   "Matching webcollection.name: " + webcollection.name + ", and given collection: " + collection );

    return webcollection.name === collection;
};

module.exports.types = function(type, webcollection) {
    this.log.debug({ storedTypes: webcollection.types, givenType: type },
		   "Matching webcollection types: " + webcollection.types.join(",") + " against given type: " + type);

    return webcollection.types.filter(function(collectiontype) {
	return type === collectiontype;
    }).length > 0;
};

module.exports.location = function(referrer, location) {
    this.log.debug({ referrer: referrer, location: location.url },
		   "Trying to match parsed referrer: " + referrer.href + " with stored location: " + location.url);

    var parsed = urlParse(location.url);

    if (!location.shared) {

	var score = 0;

	if (parsed.hostname === referrer.hostname) {
	    score += 1;
	} else {
	    return false;
	}

	if (parsed.host === referrer.host) {
	    score += 1;
	} else {
	    return false;
	}

	if (parsed.pathname !== null && referrer.pathname !== null && parsed.pathname.indexOf(referrer.pathname) > -1){
	    score += 1;
	}

	if (parsed.query !== null && referrer.query !== null && parsed.query.indexOf(referrer.query) > -1) {
	    score += 1;
	}

	this.log.debug({ href: referrer.href, location: location.url }, "Resulting score for site: " + referrer.href + " is: " + score );
	return score > 0;
    }
    return false;
};
