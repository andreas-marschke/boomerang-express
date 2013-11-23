var express = require('express');
var app = module.exports = express();
var crypto = require('crypto');

var numbers = [
    "t_resp",
    "t_page",
    "t_done",
    "dom-ln",
    "dom-sz",
    "dom-sz",
    "dom-img",
    "dom-script",
    "bw",
    "bw_err",
    "lat",
    "lat_err",
    "boomr_fb",
    "t_head",
    "t_body",
    "t_domloaded"
];

// eg.: "/beacon/0000/admin/index"
app.get("/beacon/:user/:page/:state", function(req, res){
    res.type('png');
    res.send(200);

    app.parent.settings
	.db.collection('beacon_' + req.route.params.user.toString(),{strict:true},function(err, collection){
	    if (err !== null) {
		console.log('Error: ',err)
	    } else {
		var obj = mangleQuery(req.query,req.headers,req.route,req.ip,req.cookies);
		collection.insert(obj ,function (err,result) {
		    if (err !== null) {
			console.log('Error:',err);
		    }
		});
	    }
	});

});

app.get(/\/image-([0-6]).png/, function(req,res) {
    res.send(crypto.randomBytes(256));
});

app.get(/\/image-l.gif/, function(req,res) {
    res.send(crypto.randomBytes(35));
});

function mangleQuery(data,headers,route,ip,cookies) {
    var keys = Object.keys(headers);

    /* dissassemble the header so we can better
       search across the data */
    for (var i in keys) {
	if (keys[i].match("^cookie$")) {
	    var cookeys = Object.keys(cookies);
	    for(var n in cookeys ) {
		data["cookie_" + cookeys[n]] = cookies[cookeys[n]];
	    }
	} else {
	    data[keys[i]] = headers[keys[i]];
	}
    }

    /* clean request data and split up t_other
       so we have our custom timers */
    var t_other_data;
    if (typeof data['t_other'] !== "undefined") {
	t_other_data = data['t_other'].split(',');

	for(var i = 0; i < t_other_data.length;i++) {
	    var split = t_other_data[i].split('|');
	    data[split[0]] = split[1];
	}
    }
    delete data['t_other'];

    if ( typeof data['x-real-ip'] !== "undefined" ) {
	ip = data['x-real-ip'];
	delete data['x-real-ip'];
    }

    var keys = Object.keys(data);
    var obj = {};

    for (var i = 0; i < keys.length; i++ ) {
	var str = keys[i].toString();
	str = str.replace('.','-');
	if (typeof data[keys[i]] !== "undefined") {
	    obj[str] = data[keys[i]];
	}
    }

    var plugins = data.boomr_plugins;
    if( typeof plugins !== 'undefined')
	obj.boomr_plugins = plugins.split('|');


    obj.page = route.params.page;
    obj.ip = ip;
    obj.state = route.params.state;

    // make sure all numeric values from boomerang are actual numeric values in the database
    for (var i in numbers) {
	if (typeof obj[numbers[i]] !== "undefined" )
	    obj[numbers[i]] = Number(obj[numbers[i]]);
    }

    return obj;
}
