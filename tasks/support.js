"use strict";

module.exports = function(grunt) {

    grunt.registerTask("support","Write Support information as JSON to STDOUT",function() {
	var support = {
	    version: process.version,
	    versions: process.versions,
	    domain: process.domain,
	    arch: process.arch,
	    cwd: process.cwd,
	    execPath: process.execPath,
	    hrtime: process.hrtime(),
	    plattform: process.plattform,
	    umask: process.umask,
	    memoryUsage: process.memoryUsage,
	    groups: process.getgroups(),
	    config: process.config,
	    features: process.features,
	    pid: process.pid,
	    title: process.title,
	    modules: process.moduleLoadList
	};
	grunt.log.write("Support Data: \n");
	grunt.log.write(JSON.stringify(support,undefined,2));
    });
};
