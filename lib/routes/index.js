var express = require('express');
var ObjectId = require('mongodb').ObjectID;
var app = module.exports = express();
var crypto = require('crypto');

app.get("/beacon/:user/:page/:state", function(req, res){
    res.type('png');
    res.send(0);

    app.parent.settings
	.db.collection('beacon_' + req.params.user,{strict:true},function(err, collection){
	    if (err !== null) {
		app.parent.settings.logger.error('Error: ', { error: err});
		return;
	    } else {
		var obj = mangleQuery(req.query,req.headers,req.params,req.ip,req.cookies);
		
		var restiming;
		if (typeof obj.restiming !== "undefined") {
		    restiming = obj.restiming;
		    delete  obj.restiming;
		}

		collection.insert(obj ,function (err,result) {
		    if (err !== null) {
			app.parent.settings.logger.error('Error: ', { error: err});
		    }
		    if (typeof restiming !== "undefined" ) {
			sendRestiming(result[0]._id,req.params.user,restiming);
		    }
		});
	    }
	});

});

app.post("/beacon/:user/:page/:state", function(req, res){
    res.type('png');
    res.send(0);
    
    app.parent.settings
	.db.collection('beacon_' + req.params.user,function(err, collection){

	    if (err !== null) {
		app.parent.settings.logger.error('Error: ', { error: err, stack: err.stack});
		return;
	    } else {

		var obj = mangleQuery(JSON.parse(req.body.data),req.headers,req.params,req.ip,req.cookies);

		var restiming;
		if (typeof obj.restiming !== "undefined") {
		    restiming =  obj.restiming;
		    delete  obj.restiming;
		}

		collection.insert(obj ,function (err,result) {
		    if (err !== null) {
			app.parent.settings.logger.error('Error: ', { error: err});
		    }
		    if (typeof restiming !== "undefined" ) {
			sendRestiming(result[0]._id,req.params.user,restiming);
		    }
		});

	    }
	});

});


app.get("/click/:user/:page/:state", function(req, res, next){
    res.type('png');
    res.send(200);

    app.parent.settings
	.db.collection('click_' + req.params.user,{strict:true},function(err, collection){
	    if (err !== null) {
		app.parent.settings.logger.error('Error: ', { error: err});
	    } else {
		var obj = mangleQuery(req.query,req.headers,req.params,req.ip,req.cookies);
		collection.insert(obj ,function (err,result) {
		    if (err !== null) {
			app.parent.settings.logger.error('Error: ', { error: err});
		    }
		});
	    }
	});

});


function mangleQuery(data,headers,route,ip,cookies) {

    var _ip = ip;
    
    if ( typeof(_ip) === "undefined" ) {
	_ip = "";
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
	t_other_data = data.t_other.split(',');

	for(var i = 0; i < t_other_data.length;i++) {
	    var split = t_other_data[i].split('|');
	    data[split[0]] = split[1];
	}
    }
    delete data.t_other;

    if ( typeof data['x-real-ip'] !== "undefined" ) {
	_ip = data['x-real-ip'];
	delete data['x-real-ip'];
    }

    /* Anonymize IPs as much as possible */
    var hash = crypto.createHash('sha512');
    hash.update(_ip,"ascii");
    _ip = hash.digest('hex');
    hash = null;
    _ip = _ip.substr(1,_ip.length/3);

    var data_keys = Object.keys(data);
    var obj = {};

    for (index = 0; index < data_keys.length; index++ ) {
	var str = data_keys[index].toString();
	str = str.replace('.','-');
	if (typeof data[data_keys[ index ]] !== "undefined") {
	    obj[str] = data[data_keys[ index ]];
	}
    }
    
    if (typeof data.plugins !== "undefined") {
	obj.plugins = data.plugins.split(",");
    } 
    
    obj.page = route.page;
    obj.ip = _ip;
    obj.state = route.state;

    // make sure all numeric values from boomerang are actual numeric values in the database
    for (var number in app.parent.settings.data.numbers) {
	if (typeof obj[app.parent.settings.data.numbers[number]] !== "undefined" ) {
	    obj[app.parent.settings.data.numbers[number]] = 
		Number(obj[app.parent.settings.data.numbers[number]]);
	}
    }

    obj.created = new Date();

    for (var bl_index in app.parent.settings.data.blacklist) {
	if (typeof obj[app.parent.settings.data.blacklist[bl_index]] !== "undefined") {
	    delete obj[app.parent.settings.data.blacklist[bl_index]];
	}
    }
  
    return obj;
}

function sendRestiming (id,uid,data) { 
    app.parent.settings
	.db.collection('resources_' + uid ,{strict:true},function(err, resources){
	    data.forEach(function(data){
		data.ref = new ObjectId(id);
		resources.insert(data,function(err,result) { 
		    if (err !== null) { 
			app.parent.settings.logger.error('Error: ', { error: err});
		    }
		});
	    });
	});
}






