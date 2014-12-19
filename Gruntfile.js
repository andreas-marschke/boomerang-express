module.exports = function(grunt) {

    grunt.loadNpmTasks("grunt-svg2png");
    grunt.loadNpmTasks("grunt-favicons");
    grunt.loadNpmTasks("grunt-contrib-imagemin");

    grunt.initConfig({
	svg2png: {
	    all: {
		files: [{
		    src: "./assets/img/icon.svg",
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
		appleTouchBackgroundColor: 'none',
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
	}
    });

    grunt.registerTask("default", ["svg2png", "favicons", "imagemin"]);
};
