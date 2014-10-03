'use strict';

module.exports = function (grunt) {

    grunt.initConfig({ 
	pkg: grunt.file.readJSON('package.json'),
	jshint: {
	    all: ['Gruntfile.js','app.js','lib/routes/index.js']
	},
	clean: {
	    options: {},
	    src: ['lib/routes/*~','*.js~']
	},
	rpm: {
	    options: {
		destination: 'build/',
		release: true,
		summary: grunt.file.readJSON('package.json').description,
		distribution: 'centos',
		vendor: 'Andreas Marschke <andreas.marschke@gmail.com>',
		requires: [ 'node', 'npm', 'nodejs-packaging' ],
		defaultUsername: 'boomerang',
		defaultGroupname: 'boomerang',
		group: 'System Environment/Daemons',
		license: 'LGPL'
	    },
	    release: {
		options: {
		    release: true
		},
		files: [
		    { src: [ 'lib/*/*.js', 'app.js', 'public/*.png', 'public/*.gif' ], dest: 'opt/boomerang-express/'},
		    { src: [ 'config/*'], dest: 'opt/boomerang-express/'},
		    { src: "share/init.d", dest: "etc/init.d/"}
		]
	    },
	}
    });
		     
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-rpm');
    grunt.registerTask('default',['jshint']);
};
