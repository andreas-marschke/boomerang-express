var merge = require('deepmerge'),
    path = require("path");

module.exports = function(grunt) {

    var defaultConfig = {
	directory: "data~/",
	webcollections: [{
	    "_id" : "d34db33f",
	    "types" : [
		"beacon",
		"click",
		"resource"
	    ],
	    "name" : "demo-webpage",
	    "owner" : "0000",
	    "locations" : [{
		"url" : "http://localhost:4000",
		"shared" : false
	    }]
	}],
	users: [{
	    "_id" : "0000",
	    "name" : "user",
	    "via" : "local"
	}]

    };

    grunt.registerTask("developer","Setup test database for filter development for use with nedb",function(name,conf) {
	var done = this.async();
	var gruntConfig = this.options() || {};
	var jsonConfig = grunt.file.readJSON("tasks/developer.config.json");
	var config = merge(jsonConfig, gruntConfig);

	grunt.file.mkdir(config.directory);

	config.webcollections.forEach(function(collection){

	    // initialize empty collections for beaconed data
	    collection.types.forEach(function(type) {
		grunt.file.write(config.directory + path.sep + type + "_" + collection.owner + ".db","");
	    });
	})

	// store config data for users and webcollections in seperate collections
	// nedb is slightly "special" so we have to split these and concat
	var usersContent = "";
	config.users.forEach(function(user) {
	    usersContent += JSON.stringify(user);
	});
	grunt.file.write(config.directory + path.sep + "users.db", usersContent );

	var webcollectionsContent = "";
	config.webcollections.forEach(function(collection) {
	    webcollectionsContent += JSON.stringify(collection);
	});
	grunt.file.write(config.directory + path.sep + "/webcollections.db", webcollectionsContent );

    });

}
