'use strict';

module.exports = function (grunt) {

    grunt.initConfig({ 
	pkg: grunt.file.readJSON('package.json'),
	clean: {
	    options: {},
	    src: ['lib/routes/*~','*.js~']
	},
	easy_rpm: {
		options: {
			name: "<%= pkg.name %>",
			description: "<%= pkg.description %>",
			summary: "<%= pkg.description %>",
			license: "LGPL",
			vendor: "ViA-Online GmbH",
			group: "System Environment/Daemons",
			version: "<%= pkg.version %>",
			release: "<%= pkg.release %>",
			buildArch: "x86_64",
			dependencies: ["nodejs >= 0.10.3", "git", "npm >= 1.3.6"],
			keepTemp: true,
			preInstallScript: [
				"echo 'Pre-Installation Procedure:'",
				"echo ' - unless already exists add system-user \"boomerang\"'",
				"useradd --base-dir /opt --home-dir /opt/boomerang-express --no-log-init --system --shell /sbin/nologin --no-create-home boomerang || true",
				"echo 'DONE'"
			],
			postInstallScript: [
				"echo 'Post-Installation Procedure:'",
				"echo ' - installing package-dependencies into /opt/boomerang-express/node_modules'",
				"cd /opt/boomerang-express && npm install . --cache-min=1 --cache-max=2 --rollback true --color false",
				"echo 'DONE'"
			],
			postUninstall: [
				"echo 'Post-UnInstallation Procedure:'",
				"echo ' - delete system boomerang'",
				"userdel boomerang",
				"echo ' - delete empty directories'",
				"rmdir -p /usr/share/doc/boomerang-express",
				"rmdir -p /opt/boomerang-express/lib --ignore-fail-on-non-empty",
				"echo ' - delete node_modules'",
				"rm -rf /opt/boomerang-express/node_modules",
				"echo 'DONE'"
			]
		},
		release: {
			files: [
				{ 
					src:  ["lib/*/*.js","app.js","public/*.png", "public/*.gif"], 
				  	dest: '/opt/boomerang-express/',
				  	owner: "boomerang",
					group: "boomerang",
					mode: "644"
				},
				{ 
					src: ["package.json"], 
				  	dest: "/opt/boomerang-express/",
					owner: "boomerang",
					group: "boomerang",
					mode: "644"
				},
				{ 
					src:  ["config/*"], 
					dest: "/opt/boomerang-express/",
				  	owner: "root", 
					group: "boomerang",
					mode: "640"
				},
				{ 
					src:  "boomerang-express", 
				  	dest: "/etc/init.d/",
				  	cwd: "etc/init.d",
					owner: "root",
					group: "root",
					mode: "755"
				},
				{ 
					src:  "boomerang-express",
				  	dest: "/etc/default/",
				  	cwd: "etc/default",
					owner: "root",
					group: "root",
					mode: "600"
				},
				{ 
					src: "master.json.example", 
					dest: "/etc/boomerang-express/", 
					doc: "true", 
					cwd: "config/",
					owner: "root",
					group: "root",
					mode: "644"
				},
				{ 
					src: "README.md", 
					dest: "/usr/share/doc/boomerang-express",
					doc: true,
					cwd: "./",
				}
			]
		}
	}
	});
	
	grunt.loadNpmTasks('grunt-easy-rpm');
    grunt.loadNpmTasks('grunt-rpm');
	grunt.registerTask('rpm',['easy_rpm']);
};
