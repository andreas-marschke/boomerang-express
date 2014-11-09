# Set up boomerang-express and boomerang.js for Site/Technical-Operators and Administrators

Using boomerang-express and boomerang.js needs alot of buy-in not only from administrators
and developers but also from management who'll need to see benefits in gathering metrics
of users with boomerang.

Here's a crash-course introduction to the way boomerang-express can be built and integrated in
your environment:

## boomerang.js

Boomerang.js is a javascript tool to measure webpage-metrics from the initial pageload to
the full blown application. You can checkout the project at [github.com/lognormal/boomerang](https://github.com/lognormal/boomerang)


### Getting Boomerang.js

To build it for your environment clone the repository using [git](http://git-scm.com/) like this:

```shell
 $> git clone https://github.com/lognormal/boomerang.git
```

This will create a directory containing the boomerang project. Once you've `cd`'ed into the
directory you can build your own boomerang.js version like this:

First install the required packages from [npm](https://www.npmjs.org/):

```shell
 $> npm install .
```

After that edit the plugins.json to define what plugins you really need in your environment
ie. like this:

```json
{
  "plugins" : [
    "plugins/bw.js",
    "plugins/ipv6.js",
	"plugins/restiming.js",
	"plugins/navtiming.js",
	"plugins/rt.js"
  ]
} 
```
#### Plugins

This will include the following plugins in the final build:

- BW: [Bandwidth measurement plugin](http://www.lognormal.com/boomerang/doc/api/BW.html)
- RT: [Roundtrip timing plugin](http://www.lognormal.com/boomerang/doc/api/RT.html)
- IPv6: [IPv6 validation plugin](http://www.lognormal.com/boomerang/doc/api/ipv6.html)
- NavTiming: _works only in supported browsers_ [Navigation Timing API](http://www.lognormal.com/boomerang/doc/api/navtiming.html)
- ResTiming: _works only in supported browsers_ [Resource Timing API](http://www.lognormal.com/boomerang/doc/api/restiming.html)

Feel free to browse the multitude of other plugins und der `plugins/` as well to
get a full view as to what is possible with boomerang.

### Building Boomerang.js

Once you've decided which plugins to use for your environment you can run:

```shell
$> grunt
Running "clean:build" (clean) task
>> 1 path cleaned.

Running "clean:src" (clean) task
>> 0 paths cleaned.

Running "concat:debug" (concat) task
File build/boomerang-0.9.0-debug.js created.

Running "concat:release" (concat) task
File build/boomerang-0.9.0.js created.

Running "string-replace:release" (string-replace) task
File build/boomerang-0.9.0.js created.

Running "uglify:min_release" (uglify) task
>> 1 sourcemap created.
>> 1 file created.

Running "uglify:min_debug" (uglify) task
>> 1 sourcemap created.
>> 1 file created.

Done, without errors.

$>
```

When this is done you should find a directory called `build/` in your project tree with contents like this:

```shell
$> ls build/
boomerang-0.9.0-debug.js      boomerang-0.9.0-debug.min.js.map  boomerang-0.9.0.min.js
boomerang-0.9.0-debug.min.js  boomerang-0.9.0.js                boomerang-0.9.0.min.js.map
$>
$>
```

Use the debug versions if it is your first time with boomerang and the non-debug version if you wish to
use it in production.


### Using it in your project

As you now have a working build of boomerang go ahead and include it in your web-project:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="/javascripts/boomerang.min.js" type="text/javascript"> </script>
    <script type="text/javascript">
	  // Boomerang initialization
    </script>
    <title>Your title</title>
    <link rel='stylesheet' href='/stylesheets/style.css' />
  </head>
  <body>
    <!-- Your content here -->
  </body>
</html>
```

The performance wary may be worried as they know that javascript may only be included
in the bottom of the `<body>` element and load them asyncronously. However to measure the
complete website boomerang needs to see the page itself unfold before it.

In the `// Boomerang initalization` block you can write something like this:

```javascript
BOOMR.init({
    beacon_url: "//<boomerang-express server>/beacon/0000",
    RT: {
        cookie: "cookie-rt", 
        strict_referrer: false
    },
    BW: {
        base_url: "//<boomerang-express server>/",
        cookie: "cookie-bw",
        nruns: 1
    }
});

```

This tells boomerang to configure the Bandwidth and Roundtrip plugins as described in the
documentation ([see above](#Plugins)).

Now that this is setup we can get to boomerang-express and the server-side of this project.

## boomerang-express

By itself boomerang-express is a simple reciever of requests from sites and pages implementing
boomerang.js for tracking real users.

### Building and deploying boomerang-express on CentOS

For the following steps you'll need a CentOS Server (minimum CentOS 6.5) with the following
packages pre-installed:

- `git` - for cloning the repository
- `rpmdevtools` - to build the rpm package
- `rpmlint` - to validate the package
- `nodejs` - to run the build-process (*should* include `npm`)

If you have satisfied these requirements you can follow these instructions on the CentOS-Host:

Clone the repository from: https://github.com/andreas-marschke/boomerang-express.git

```shell
 $> git clone https://github.com/andreas-marschke/boomerang-express.git
```

In the root of the clone issue this command:

```shell
 $> npm install .
```

This will install all the necessairy dependencies.

After that you can build the package:

```shell
 $> ./node_modules/.bin/grunt rpm
```

After the last command has finished you'll find a package called
boomerang-express-<version>.noarch.rpm in the root directory you can install
this rpm now on all your CentOS Servers you plan to runn boomerang-express on.

You can install it with:

```shell
$> rpm -vi boomerang-express-0.0.1.noarch.rpm
```

Once this is done you can edit the configuration of boomerang-express prior to
the server starting.

### Configuration
