var Mocha = require('mocha'),
    configs = require("./configs.js"),
    Database = require("mongodb").Db,
    fs = require("fs"),
    Server = require("mongodb").Server,
    assert = require('chai').assert,
    shortid = require('shortid');

var mocha = new Mocha({
    ui: "tdd",
    reporter: "spec",
    globals: ["Datastore","mongodb","Mocha", "assert"],
    bail: false,
    slow: 2000,
    ignoreLeaks: false
});

function LoggerFake ()  {
    this.counter =  { 
	loggedErrors: 0,
	loggedInfos: 0,
	loggedWarns: 0
    };

    this.info = function() {
	this.counter.loggedInfos++;
    };
    
    this.error = function() { 
	this.counter.loggedErrors++;
    };
    
    this.warn = function() { 
	this.counter.loggedWarns++;
    };

    return this;
};

describe("Boomerang-Express Backends",function() {

    describe("Initialization",function() { 
	it("Should be able to require",function() { 
	    var Datastore = require("../../lib/backends/index");
	    assert.isNotNull(Datastore);
	});
	
	it("Should be possible to initialize without params",function(){
	    var Datastore = require("../../lib/backends/index");
	    
	    var ds = new Datastore();
	    
	    assert.isNotNull(ds);
	});
	
	it("Should create an instance of Datastore",function() { 
	    var Datastore = require("../../lib/backends/index");
	    assert.instanceOf(new Datastore(),Datastore,"Datastore");
	});

	it("Should use a defined instance of a passed logger",function() { 

	    var Datastore = require("../../lib/backends/index");
	    var logFake = new LoggerFake();
	    var ds = new Datastore({ },logFake);
	    
	    assert.instanceOf(ds.log,LoggerFake,"Logger");

	});
    });
    
    describe("MongoDB backend",function() {
	
	it("Should create a Backend instance of Datastore",function() { 
		    
	    var Datastore = require("../../lib/backends/index");
	    var Backend = require("../../lib/backends/mongodb/index");
	    assert.instanceOf(new Datastore(configs.mongodb.ds_config_empty),Backend,"Datastore");
	});

	it("Should use a defined instance of a passed logger",function() { 

	    var Datastore = require("../../lib/backends/index");
	    var logFake = new LoggerFake();
	    var ds = new Datastore(configs.mongodb.ds_config_empty,logFake);
	    
	    assert.instanceOf(ds.log,LoggerFake,"Logger");

	});

	it("Should emit 'dbOpenError' on empty config",function(done){
	    var Datastore = require("../../lib/backends/index");
	    
	    var ds = new Datastore(configs.mongodb.ds_config_empty);
	    
	    ds.on("dbOpenError",function(err) { 
		done();
	    });
	});

	
	it.skip("Should emit 'open' on config with host that listen on 27017 by default",function(done){	    
	    var Datastore = require("../../lib/backends/index");
	    
	    var ds = new Datastore(configs.mongodb.ds_config_with_host_and_test);
	    
	    ds.on("open",function() {
		done();
	    });
	});
	
	it.skip("Should emit beaconInserted on inserting into the beacon collection...",function(done) { 

	    var Datastore = require("../../lib/backends/index");
	    
	    var ds = new Datastore(configs.mongodb.ds_config_with_host_and_test);
	    
	    ds.on("open",function(dsInstance) {
		dsInstance.insert("beacon","0000",{ data : "1234" });
		dsInstance.on("beaconInserted",function(result){ 
		    assert.defined(result);
		    done();
		});
	    });
	});
    });
    
    describe("NeDB backend", function() { 
	
	it("Should create a Backend instance if Datastore", function() { 
	    var Datastore = require("../../lib/backends/index");
	    var Backend = require("../../lib/backends/nedb/index");
	    assert.instanceOf(new Datastore(configs.nedb.ds_config_empty),Backend,"Datastore");
	});

	it("Should use a defined instance of a passed logger",function() { 

	    var Datastore = require("../../lib/backends/index");
	    var logFake = new LoggerFake();
	    var ds = new Datastore(configs.nedb.ds_config_empty,logFake);
	    
	    assert.instanceOf(ds.log,LoggerFake,"Logger");

	});
	
	it("Should emit 'dbOpenError' and create an instance of itself when a non-existant directory was set",function(done) { 
	    var Datastore = require("../../lib/backends/index");
	    var Backend = require("../../lib/backends/nedb/index");
	    var ds = new Datastore(configs.nedb.ds_config_no_data_dir);
	    assert.instanceOf(ds,Backend,"Datastore");

	    ds.on("dbOpenError",function(error) {
		assert.instanceOf(error,Error,"Error");
		done();
	    });
	});

	it("Should emit 'dbOpenError' when a directory was set that does not contain files matching the *.db regex",function(done){
	    var Datastore = require("../../lib/backends/index");
	    var Backend = require("../../lib/backends/nedb/index");
	    var ds = new Datastore(configs.nedb.ds_config_with_data_dir_no_content);
	    ds.on("dbOpenError",function(err){ 
		done();
	    });
	});
    });

    describe("database insertion tests",function () { 

	var dir_id = shortid.generate();
	var directory = configs.nedb.tmpdir + "/tmp-" + dir_id;
	
	var files = [ directory + "/beacon_0000.db",		      
		      directory + "/resource_0000.db"
		    ];
	
	beforeEach(function(done){
	    fs.mkdir(directory,function() { 
		files.forEach(function(file,index,array) {
		    fs.writeFile(file, "",function() { 
			if (index == (array.length -1)) { 
			    done();
			}
		    });
		});
	    });
	});

	afterEach(function(done){ 
	    files.forEach(function(file,index,array){
		fs.unlinkSync(file);
		if (index == (array.length -1) ) { 
		    fs.rmdir(configs.nedb.tmpdir + "/tmp-" + dir_id,function() { 
			done();
		    });
		}
	    });
	});

	it("Should emit 'open' and create an instance of itself when an existing directory was set and has *.db files",function(done){ 
	    var Datastore = require("../../lib/backends/index");
	    var config = configs.nedb.ds_config_with_data_dir_no_content;
	    config.nedb.directory = directory;
	    config.nedb.autoload = true;

	    var ds = new Datastore(config);
	    ds.on("open",function(dsInstance) { 
		done();
	    });
	});

	it("Should emit 'beaconInserted' on newly created objects and return the id of the object",function(done){

	    var Datastore = require("../../lib/backends/index");
	    var config = configs.nedb.ds_config_with_data_dir_no_content;
	    config.nedb.directory = directory;
	    config.nedb.autoload = true;

	    var ds = new Datastore(config);
	    ds.on("open",function(dsInstance) { 
		dsInstance.insert("beacon","0000",{});
		dsInstance.on("beaconInserted",function(id) { 
		    assert.isString(id);
		    done();
		});
	    });
	});
    });
});






