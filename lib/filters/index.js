"use strict";

var crypto = require("crypto");

var Filter = module.exports = function (options, logger) {
    this.config = options;



    if (typeof (logger) === "object") {
	this.log = logger;
    } else {
	this.log = console;
    }

    this.log.info("Filter logger initialized!");

    return this;
};

Filter.prototype.munge = function (data, headers, route, ip, agent, cookies) {

    if ( typeof(ip) === "undefined" ) {
	ip = "";
    }

    var keys = Object.keys(headers);
    /* dissassemble the header so we can better
       search across the data */
    var cookieObject = {}, headerObject = {};
    for (var k in keys) {
	if (keys[k].match("^cookie$")) {
	    var cookeys = Object.keys(cookies);
	    for(var n in cookeys ) {
		cookieObject[ "c_" + cookeys[n]] = cookies[cookeys[n]];
	    }
	} else {
	    headerObject[keys[k]] = headers[keys[k]];
	}
    }
    data.headers = headerObject;

    this.log.debug({ headers: headerObject, cookies: cookieObject },"Parsed Headers")

    /* properly serialize Cookies */
    var cookiesKeys = Object.keys(cookieObject);
    for (var key in cookiesKeys) {
	var keyValuePairs = cookieObject[cookiesKeys[key]].split("&");
	tmpObject = {};
	for (var pairIndex in keyValuePairs) {
	    var pairs = keyValuePairs[pairIndex].split("=");
	    tmpObject[pairs[0]] = pairs[1];
	}
	cookiesObject[cookiesKeys[key]] = tmpObject;
    }

    this.log.debug({ cookies: cookieObject },"Cookies serialized...");

    data.cookies = cookieObject;

    /* clean request data and split up t_other so we have our custom timers */
    var t_other_data, customTiming = {};
    if (typeof data.t_other !== "undefined") {
	t_other_data = data.t_other.split(",");

	for(var i = 0; i < t_other_data.length;i++) {
	    var split = t_other_data[i].split("|");
	    customTiming[split[0]] = split[1];
	}
    }
    delete data.t_other;
    data.customTiming = customTiming;

    /* Anonymize IPs as much as possible */
    var hash = crypto.createHash("sha512");
    hash.update(ip,"ascii");
    ip = hash.digest("hex");
    hash = null;
    ip = ip.substr(1, ip.length/3);

    var data_keys = Object.keys(data);
    var obj = {};

    obj.agent = agent;

    for (var index = 0; index < data_keys.length; index++ ) {
	var str = data_keys[index].toString();
	str = str.replace(".", "-");
	if (typeof data[data_keys[ index ]] !== "undefined") {
	    obj[str] = data[data_keys[ index ]];
	}
    }

    if (typeof data.plugins !== "undefined") {
	obj.plugins = data.plugins.split(",");
    }

    obj.page = route.page;
    obj.ip = ip;
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

    return obj;
};
