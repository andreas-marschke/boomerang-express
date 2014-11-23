"use strict";
/* eslint-disable camelcase */
module.exports = function (grunt) {
    var rpm = grunt.file.readJSON("rpm.json");

    grunt.initConfig({
	pkg: grunt.file.readJSON("package.json"),
	eslint: {
	    options: {
		format: "compact"
	    },
	    target: [
		"tasks/*.js",
		"Gruntfile.js",
		"app.js",
		"lib/**/*.js",
		"lib/backends/**/*",
		"tests/**/*.js"
	    ]
	},
	clean: {
	    options: {},
	    src: ["lib/routes/*~", "*.js~"],
	    rpmTmp: ["tmp-*"]
	},
	mochaTest: {
	    test: {
		options: {
		    reporter: "spec",
		    quiet: false,
		    clearRequireCache: true,
		    gc: true
		},
		src: ["tests/*.js"]
	    },
	    auto: {
		options: {
		    reporter: "tap",
		    quiet: false,
		    clearRequireCache: true,
		    gc: true
		},
		src: ["tests/*.js"]
	    },
	    "html-cov": {
		options: {
		    reporter: "html-cov",
		    quiet: true,
		    captureFile: "tests/coverage.html"
		},
		src: ["tests/*.js"]
	    }
	},
	exec: {
	    lint: {
		command: "(which rpmlint && rpmlint --file=.rpmlintrc <%= pkg.name %>-<%= pkg.version %>-<%= easy_rpm.options.release%>.<%= easy_rpm.options.buildArch %>.rpm) || exit -1",
		stdErr: true,
		stdOut: true,
		exitCode: 0
	    }
	},
	developer: {},
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

    grunt.loadTasks("tasks");

    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-easy-rpm");
    grunt.loadNpmTasks("grunt-mocha-test");

    grunt.registerTask("rpm", ["clean:rpmTmp", "easy_rpm", "exec:lint"]);
    grunt.registerTask("test", ["eslint"], ["mochaTest:auto"]);
    grunt.registerTask("default", ["eslint"]);
};
