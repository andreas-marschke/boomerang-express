'use strict';

module.exports = function (grunt) {

    grunt.initConfig({ 
	pkg: grunt.file.readJSON('package.json'),
	clean: {
	    options: {},
	    src: ['lib/routes/*~','*.js~'],
		rpm_tmp: ['tmp-*']
	},
	exec: {
		lint: {
			command: "(which rpmlint && rpmlint --file=.rpmlintrc <%= pkg.name %>-<%= pkg.version%>-<%= pkg.release %>.<%= easy_rpm.options.buildArch %>.rpm) || exit -1",
			stdErr: true,
			stdOut: true,
			exitCode: 0
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
			release: "<%= pkg.release %>",
			buildArch: "noarch",
			dependencies: ["nodejs >= 0.10.3", "git", "npm >= 1.3.6"],
			keepTemp: true,
			changelog: [
				"* Sat Oct 25 2014 Andreas Marschke <andreas.marschke@gmail.com> 0.0.1-1",
				"- initial package"
			],
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
				"chkconfig --add boomerang-express",
				"echo 'DONE'"
			],
			preUninstallScript: [
				"chkconfig --del boomerang-express"
			],
			postUninstallScript: [
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
				  	dest: "/etc/rc.d/init.d/",
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
	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-contrib-clean');;
	// Linting using rpmlint
	grunt.registerTask('rpm_lint',['exec:lint']);
	
	grunt.registerTask('rpm_tmp_clean',['clean:rpm_tmp']);

	grunt.loadNpmTasks('grunt-easy-rpm');

	grunt.registerTask('rpm',['rpm_tmp_clean','easy_rpm','rpm_lint']);
};
