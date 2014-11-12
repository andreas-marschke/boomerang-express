"use strict";

module.exports = function (grunt) {

    var rpm = grunt.file.readJSON("rpm.json");

    grunt.initConfig({
	pkg: grunt.file.readJSON("package.json"),
	eslint: {
	    options: {
		format: "compact"
	    },
	    target: [
		"Gruntfile.js",
		"app.js",
		"lib/*/*.js",
		"lib/backends/*/*"
	    ]
	},
	clean: {
	    options: {},
	    src: ["lib/routes/*~", "*.js~"],
	    rpmTmp: ["tmp-*"]
	},
	exec: {
	    lint: {
		command: "(which rpmlint && rpmlint --file=.rpmlintrc <%= pkg.name %>-<%= pkg.version %>-<%= easy_rpm.options.release%>.<%= easy_rpm.options.buildArch %>.rpm) || exit -1",
		stdErr: true,
		stdOut: true,
		exitCode: 0
	    }
	},
	testdb: {
	    options: {
		directory: "data~"
	    }
	},
	easy_rpm: {
	    options: {
		name: "<%= pkg.name %>",
		description: "<%= pkg.description %>",
		summary: "<%= pkg.description %>",
		license: "<%= pkg.license %>",
		vendor: "ViA-Online GmbH",
		group: "System Environment/Daemons",
		version: "<%= pkg.version %>",
		url: "<%= pkg.homepage %>",
		release: "<%= pkg.release %>.<%= grunt.template.today('yyyymmdd').toString() %>",
		buildArch: "noarch",
		dependencies: ["nodejs >= 0.10.32", "git", "npm >= 1.3.6", "shadow-utils"],
		keepTemp: true,
		changelog: [
		    "* <%= grunt.template.today('ddd mmm dd yyyy') %> Andreas Marschke <andreas.marschke@gmail.com> <%= easy_rpm.options.version %>-<%= easy_rpm.options.release %>",
		    "- initial package"
		],
		preInstallScript: rpm.preinst,
		postInstallScript: rpm.postinst,
		preUninstallScript: rpm.preun,
		postUninstallScript: rpm.postun
	    },
	    release: {
		files: rpm.files
	    }
	}
    });

    grunt.registerTask("testdb","Setup test database for filter development",function(name,conf) {
	var config = this.options() || {};

	var collections = [ "beacon_0000", "click_0000", "resource_0000" ];

	if (typeof config.directory === "undefined") {
	    config.directory = "data";
	}

	grunt.file.mkdir(config.directory);
	for (var collection in collections) {
	    grunt.file.write(config.directory + "/" + collections[collection] + ".db","");
	}
    });

    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-clean");

    grunt.loadNpmTasks("grunt-eslint");

    // Linting using rpmlint
    grunt.registerTask("rpmLint", ["exec:lint"]);
    grunt.registerTask("rpmTmpClean", ["clean:rpmTmp"]);

    grunt.loadNpmTasks("grunt-easy-rpm");
    grunt.registerTask("rpm", ["rpmTmpClean", "easy_rpm", "rpmLint"]);

    grunt.registerTask("default", ["eslint"]);
};
