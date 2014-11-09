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

Filter.prototype.munge = function (data, headers, route, ip, agent, cookies) {

    if ( typeof(ip) === "undefined" ) {
	ip = "";
    }

    var keys = Object.keys(headers);
    /* dissassemble the header so we can better
       search across the data */
    for (var k in keys) {
	if (keys[k].match("^cookie$")) {
	    var cookeys = Object.keys(cookies);
	    for(var n in cookeys ) {
		data["cookie_" + cookeys[n]] = cookies[cookeys[n]];
	    }
	} else {
	    data[keys[k]] = headers[keys[k]];
	}
    }

    /* clean request data and split up t_other
       so we have our custom timers */
    var t_other_data;
    if (typeof data.t_other !== "undefined") {
	t_other_data = data.t_other.split(",");

	for(var i = 0; i < t_other_data.length;i++) {
	    var split = t_other_data[i].split("|");
	    data[split[0]] = split[1];
	}
    }
    delete data.t_other;

    if ( typeof data["x-real-ip"] !== "undefined" ) {
	ip = data["x-real-ip"];
	delete data["x-real-ip"];
    }

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

    for (var number in this.config.numbers) {
	if (typeof obj[this.config.numbers[number]] !== "undefined" ) {
	    obj[this.config.numbers[number]] =
		Number(obj[this.config.numbers[number]]);
	}
    }

    obj.created = new Date();

    for (var bl_index in this.config.blacklist) {
	if (typeof obj[this.config.blacklist[bl_index]] !== "undefined") {
	    delete obj[this.config.blacklist[bl_index]];
	}
    }

    return obj;
};
