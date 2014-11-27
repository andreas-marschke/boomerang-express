"use strict";

var crypto = require("crypto"),
    lodash = require("lodash");

lodash.mixin(require("lodash-deep"));

function Filter(options, logger) {
    this.config = options || {};

    if (typeof this.config.key === "undefined") {
	this.config.key = "abcdefghijklmnop";
    }

    if (typeof (logger) === "object") {
	this.log = logger;
    } else {
	this.log = console;

	// "polyfill debug()",
	this.log.debug = console.info;
    }

    return this;
};

Filter.prototype.serializeSingleHeader = function(headerValue) {
    if (headerValue.match(",") || headerValue.match(";")) {
	return headerValue.split(",").map(function(lang){
	    if ( lang.match(";") ) {
		return lang.split(";");
	    }
	    return lang;
	}).map( function(languageWithQuality){
	    if (typeof languageWithQuality === "object"){
		if (languageWithQuality[1].match("=")){
		    return {
			name: languageWithQuality[0],
			rank: languageWithQuality[1].split("=")[1]
		    };
		}
	    }
	    return languageWithQuality;
	});
    } else {
	return headerValue;
    }
};

Filter.prototype.serializeHeaders = function(headers) {
    var headerObject = {};

    if (! (typeof headers === "object" ) || headers === null ) {
	return headerObject;
    }

    var headerNames = Object.keys(headers);
    for (var headerName in headerNames) {
	switch (headerNames[headerName]) {
	case "user-agent":
	    break;
	case "cookie":
	    break;
	default:
	    headerObject[headerNames[headerName]] = this.serializeSingleHeader(headers[headerNames[headerName]]);
	}
    }

    this.log.debug({ headers: headerObject },"Serialized Headers");

    return headerObject;
};

Filter.prototype.serializeTimers = function(timers) {

    if (timers === "") {
	return {};
    }

    var tOtherData, customTiming = {};
    if (typeof timers !== "undefined") {
	tOtherData = timers.split(",");
	for(var i = 0; i < tOtherData.length;i++) {
	    var split = tOtherData[i].split("|");
	    customTiming[split[0]] = parseInt(split[1]);
	}
    } else {
	return {};
    }

    return customTiming;
};

Filter.prototype.inflate = function(data) {

    var obj = {},
	safeNumeric = this.safeNumeric,
	re = /(_|\.)/g;
    var inflatableKeys = Object.keys(data).filter(function(key){
	if (key.match(re) !== null) {
	    return true;
	} else {
	    obj[key] = data[key];
	    return false;
	}
    });


    inflatableKeys.forEach(function(key) {
	lodash.deepSet(obj,key.replace(/(_|\.)/g, "."), safeNumeric(data[key]));
    });

    return obj;
};

Filter.prototype.safeNumeric = function(item){
    if (typeof item === "string") {
	if ( item === "" ) {
	    return "";
	} else if( ! isNaN(item) ) {
	    item = parseInt(item);
	}
    }
    return item;
};

Filter.prototype.serialize = function (data, headers, route, ip, agent, cookies, callback) {

    if(arguments.length === 0) {
	this.log.warn(new Error("Called with no arguments!"));
	return {};
    }

    // if we fail we shall fail gracefully!
    if (typeof data === "undefined" || data === null) {
	data = {};
    }

    if (typeof headers === "undefined" || headers === null) {
	headers = {};
    }

    if (typeof route === "undefined" || route === null) {
	route = {
	    page: "none",
	    state: "none"
	};
    }

    if (typeof cookies === "undefined" || cookies === null) {
	cookies = {};
    }

    if (typeof agent === "undefined" || agent === null) {
	agent = {};
    }

    /* DoNotTrack tag in headers */
    if (!(typeof headers.dnt === "undefined") && headers.dnt === 1 && (this.config.dnt) ) {
	this.log.info("Configured to honor DNT and User set DNT=1 so not continuing ");
	return {};
    }

    /* split up t_other so we have our custom timers */
    var customTiming = this.serializeTimers(data.t_other);
    delete data.t_other;

    var obj = this.inflate(data);
    obj.customTiming = customTiming;

    var Ip ="";
    if (typeof ip !== "undefined" && ip !== null) {
	Ip = ip;
    }

    obj.ip = crypto.pbkdf2Sync(Ip,this.config.key,3,30).toString("hex");
    obj.ip = obj.ip.substr(1, obj.ip.length/2 );

    /* Store Metadata */
    // need to sanitize cookies by inflating since cookies may or may not have
    // dots in keys which cookie-parser can't care for (don't blame'm)
    // which makes datastores cry... :(
    obj.cookies = this.inflate(cookies);
    obj.headers = this.serializeHeaders(headers);

    obj.agent = agent;

    if (typeof data.plugins !== "undefined") {
	obj.plugins = data.plugins.split(",");
    }

    var safeNumeric = this.safeNumeric;
    Object.keys(obj).forEach(function(key){
	obj[key] = safeNumeric(obj[key]);
    });

    // TODO: Keep or not keep?
    obj.created = new Date();

    obj.page = route.page;
    obj.state = route.state;
    this.log.info({ object: obj }, "Done filtering...");

    if (typeof callback === "function") {
	callback( obj );
    }

    return obj;
};

module.exports = Filter;
