"use strict";

var crypto = require("crypto");

var Filter = module.exports = function (options, logger) {
    this.config = options;



    if (typeof (logger) === "object") {
	this.log = logger;
    } else {
	this.log = console;
    }

    return this;
};

Filter.prototype.serializeHeaders = function(headers) {
    var headerObject = {};

    var keys = Object.keys(headers);
    for (var k in keys) {
	switch (keys[k]) {
	case "user-agent":
	    break;
	case "accept-encoding":
	case "accept-language" :
	case "accept":
	    headerObject[keys[k]] = headers[keys[k]].split(",");
	    break;
	case "cookie":
	    break;
	default:
	    headerObject[keys[k]] = headers[keys[k]];
	}
    }

    this.log.debug({ headers: headerObject },"Serialized Headers");

    return headerObject;
};

Filter.prototype.serializeTimers = function(timers) {

    var tOtherData, customTiming = {};
    if (typeof timers !== "undefined") {
	tOtherData = timers.split(",");
	for(var i = 0; i < tOtherData.length;i++) {
	    var split = tOtherData[i].split("|");
	    customTiming[split[0]] = split[1];
	}
    }
    return customTiming;
};

Filter.prototype.anonymize = function(ip) {

    /* Anonymize IPs as much as possible */
    var hash = crypto.createHash("sha512");

    hash.update(ip,"ascii");

    ip = hash.digest("hex");

    hash = null;

    return ip.substr(1, ip.length/3);
};

Filter.prototype.munge = function (data, headers, route, ip, agent, cookies) {

    /* DoNotTrack tag in headers */
    if (headers["dnt"] == 1 && (this.config.dnt) ) {
	this.log.info("Configured to honor DNT and User set DNT=1 so not continuing ");
	return {};
    }

    /* Store Metadata */
    data.cookies = cookies;
    data.headers = this.serializeHeaders(headers);

    /* split up t_other so we have our custom timers */
    data.customTiming = this.serializeTimers(data.t_other);
    delete data.t_other;

    var obj = {};
    obj.ip = this.anonymize(ip);
    obj.agent = agent;

    var data_keys = Object.keys(data);
    for (var index = 0; index < data_keys.length; index++ ) {
	var str = data_keys[index].toString();
	str = str.replace(".", "_");
	if (typeof data[data_keys[ index ]] !== "undefined") {
	    obj[str] = data[data_keys[ index ]];
	}
    }

    if (typeof data.plugins !== "undefined") {
	obj.plugins = data.plugins.split(",");
    }

    obj.page = route.page;
    obj.state = route.state;

    // make sure all numeric values from boomerang are actual
    //numeric values in the database

    Object.keys(obj).forEach(function(key){
	if( ! isNaN(obj[key]) ) {
	    obj[key] = parseInt(obj[key]);
	}
    });

    // TODO: Keep or not keep?
    obj.created = new Date();

    for (var bl_index in this.config.blacklist) {
	if (typeof obj[this.config.blacklist[bl_index]] !== "undefined") {
	    delete obj[this.config.blacklist[bl_index]];
	}
    }

    this.log.info({ object: obj }, "Done filtering...");

    return obj;
};
