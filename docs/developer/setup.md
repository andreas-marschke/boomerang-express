# Setting up boomerang-express for development

Open source services such as this one thrive on the contributions of others and the support of a
large group of developers supporting, developing and extending the core product. This document
is intended to help developers get up and running with boomerang-express in minutes and get them
to a productive state as soon as possible.

## Grunt Tasks

Boomerang-Express itself uses Grunt to manage common tasks such as:

- setting up a developer environment (`grunt developer`)
- building an RPM from the source code (`grunt rpm`, `grunt rpmlint`)
- linting (`grunt eslint`)

If this is your first time using Grunt you can have a look at the ['getting-started' documentation](http://gruntjs.com/getting-started),
which is really good!

## Setting up your development environment

After checking out your source code using `git clone` use `npm` to install the required packages
for it to work:

```shell
$> npm install .
...
$> 
```

Once this is done you can generate your first database:

```
 $> grunt developer
Running "developer" task
You're all set please add these lines to your config/development.json under the 'datastore' key:
{
  "active": "nedb",
  "nedb": {
    "directory": "./data",
    "inMemoryOnly": false,
    "autoload": false
  }
}
Done, without errors.
 $>

```

You should now see a data~ directory under the projects root directory with the following contents:

```shell
$> ls data~/
beacon_0000.db  click_0000.db  resource_0000.db  users.db  webcollections.db
$>
```

You can modify where your developer database is generated by copying and editing the tasks/developer.config.json.example
to tasks/developer.config.json. 

Usually the contents look like this:

```json
{
    "directory": "data~/",
    "webcollections": [{
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
    "users": [{
	"_id" : "0000",
	"name" : "user",
	"via" : "local"
    }]
}
```

Where directory is the directory you want to store your database in.
For an explanation of the other keys (`webcollections`, `users`) see the [How it works](../../user/backends/mongodb.md#how-it-works) section.

## Start the server

Once this is done you can start the server with `node app.js` from the root directory of the project.
By default it will print a whole lot of JSON to the screen during run time. Please review your logging
configuration if you are only interested in a specific part of your logging to be printed to the screen.

If you find raw json unreadable please take a look at [bunyan](https://github.com/trentm/node-bunyan) which
is the logging engine boomerang-express uses internally.

For a quick fix just start the service with `node app.js | node_modules/.bin/bunyan` or `node app.js | jq .`
if you have [jq](http://stedolan.github.io/jq/) installed on your system.


## Thats it!

Happy Hacking!
