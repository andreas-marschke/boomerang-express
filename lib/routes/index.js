var express = require('express');
var app = module.exports = express();
var crypto = require('crypto');

var bodyParser = require('body-parser');


app.get("/beacon/:user/:page/:state", function(req, res){
    res.type('png');
    res.send(0);

    var uid = req.params.user;

    var obj = mangleQuery(req.query,req.headers,req.params,req.ip,req.cookies);

    insert("beacon",uid,obj);

});

var parser = bodyParser.urlencoded({ strict: false, extended: true, inflate: true, reviver: true, type: "text/plain"});
app.post("/beacon/:user/:page/:state", parser, function(req, res){
    res.type('png');
    res.send(0);

    var uid = req.params.user;
    var obj = mangleQuery(JSON.parse(req.body.data),req.headers,req.params,req.ip,req.cookies);


    insert("beacon",uid,obj);

});

app.get("/click/:user/:page/:state", function(req, res, next){
    res.type('png');
    res.send(200);
    var uid = req.params.user;
       
    var obj = mangleQuery(req.query,req.headers,req.params,req.ip,req.cookies);
    
    insert("click",uid,obj);

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

function insert(type,uid,data) {

    var restiming;
    if (typeof data.restiming !== "undefined") {
	restiming = data.restiming;
	delete  data.restiming;
    }
    
    app.parent.settings.ds.insert("beacon", uid, data);
    
    app.parent.settings.ds.once( type +"Inserted",function(id) {
	if (restiming !== null ) {
	    restiming.forEach(function(ressource) { 
		ressource.refer = app.parent.settings.ds.toOID(id);
		app.parent.settings.ds.insert("restiming",uid,ressource);
	    });
	}
    });
    
}
