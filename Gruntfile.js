module.exports = function(grunt) {
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-svg2png");
    grunt.loadNpmTasks("grunt-favicons");
    grunt.loadNpmTasks("grunt-contrib-imagemin");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-jekyll");

    grunt.initConfig({
	watch: {
	    javascript: {
		tasks: ["uglify"],
		options: {
		    interrupt: true
		},
		files: [
		    "assets/js/site.js"
		]
	    },
	    css: {
		tasks: ["cssmin"],
		options: {
		    interrupt: true
		},
		files: [
		    "assets/css/site.css"
		]
	    }
	},
	clean: {
	    options: {},
	    temp: ["**~"],
	    build: [
		"./assets/img/icon.png",
		"./assets/img/icons",
		"./assets/js/base.min.js",
		"./assets/css/build.min.css",
		"./assets/fonts"
	    ]
	},
	copy: {
	    fonts: {
		files: [{
		    expand: true,
		    flatten: true,
		    src: [
			"assets/vendor/bootstrap/dist/fonts/*.{eot,otf,svg,ttf,woff}",
			"assets/vendor/font-awesome/fonts/*.{eot,otf,svg,ttf,woff}"
		    ],
		    dest: 'assets/fonts',
		    filter: 'isFile'
		}]
	    }
	},
	svg2png: {
	    icon: {
		files: [{
		    src: "./assets/img/icon.svg",
		    dest: "."
		}]
	    },
	    content: {
		files: [{
		    src: "./assets/img/content/*.svg",
		    dest: "."
		}]
	    }
	},
	favicons: {
	    options: {
		apple: true,
		regular: true,
		trueColor: true,
		sharp: 0,
		appleTouchBackgroundColor: '#e4edf8',
		appleTouchPadding: 15,
		windowsTile: true,
		tileBlackWhite: true,
		tileColor: "#50A8F8",
		firefox: true,
		firefoxRound: false,
		androidHomescreen: true
	    },
	    icons: {
		src: "./assets/img/icon.png",
		dest: "./assets/img/icons"
	    }
	},
	imagemin: {
	    icons: {
		options: {
		    optimizationLevel: 3
		},
		files: [{
		    expand: true,
		    src: "./assets/img/icons/**.png",
		    dest: ""
		}]
	    }
	},
	cssmin: {
	    minify: {
		options: {
		    keepSpecialComments:false,
		    expand: true
		},
		files: [{
		    "assets/css/build.min.css": [
			"assets/vendor/bootstrap/dist/css/bootstrap.min.css",
			"assets/vendor/font-awesome/css/font-awesome.css",
			"assets/css/site.css"
		    ]
		}]
	    }
	},
	uglify: {
	    minify: {
		options: {
		    report: 'gzip',
		    ASCIIOnly: true,
		    preserveComments: false
		},
		files: {
		    "assets/js/base.min.js": [
			"assets/vendor/jquery/dist/jquery.js",
			"assets/vendor/bootstrap/dist/js/bootstrap.js",
			"assets/vendor/holderjs/holder.js",
			"assets/js/site.js"
		    ]
		}
	    }
	},
	jekyll: {
	    serve: {
		options: {
		    bundleExec: false,
		    config: '_config.yml',
		    drafts: true,
		    serve: true
		}
	    }
	}
    });

    grunt.registerTask("default", ["clean", "copy", "svg2png", "favicons", "imagemin", "cssmin", "uglify"]);
    grunt.registerTask("serve", ["watch"]);
};
