![Logo](docs/assets/img/png/logo.png "Logo")

# Boomerang-Express

[![Build Status](https://travis-ci.org/andreas-marschke/boomerang-express.svg?branch=master)](https://travis-ci.org/andreas-marschke/boomerang-express)

A recieving server for [boomerangjs](https://github.com/lognormal/boomerang) beacon data and structured storage.

## Usage

For this you will need boomerang.js see: https://github.com/lognormal/boomerang

Your webpage code may look like this: 
```
<!DOCTYPE html>
<html>
  <head>
    <script src="/javascripts/boomerang.min.js" type="text/javascript"> </script>
    <script type="text/javascript">
      BOOMR.init({
        beacon_url: "//<boomerang-express server>/beacon/0000",
        DNS : {
          base_url: "//*.<boomerang-express server>/"
        }, 
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
    </script>
    <script type="text/javascript">
      BOOMR.plugins.RT.startTimer("t_head");
    </script>
    <title><%= title %></title>
    <link rel='stylesheet' href='/stylesheets/style.css' />
    <script type="text/javascript"> 
      BOOMR.plugins.RT.endTimer("t_head").startTimer("t_body");
    </script>
  </head>
  <body>
    <h1><%= title %></h1>
    <p>Welcome to <%= title %></p>
  </body>
  <script type="text/javascript"> 
    BOOMR.plugins.RT.endTimer("t_body");
  </script>
</html>
```

If you've setup the boomerang-express server correctly the above code
will run DNS latency, Roundtrip and Bandwidth tests as described in
the boomerang.js documentation (see: http://lognormal.github.com/boomerang/docs/).

On the boomerang-express side you will see requests to
`image-(+*).(png|gif)` and `/beacon/0000`.

`/beacon/0000` will recieve a parameterized GET request containing data
from the evaluation of previously described tests. boomerang-express will
save this data together with the Customer Identification Number (here
`0000`) into the mongodb under the `beacon_0000` collection.

_NOTE:_ boomerang-express expects pre-existing collections ie. `beacon_0000`.

Should you have enabled the boomerang.js plugins clicks and restiming
you'll also see data inserted into the collections `restiming_0000` and
`clicks_0000` where these handle the specific data of these plugins.

If you have more than one customer you'd like to manage add a
different ID to each of the beacon-urls like 

```js
  beacon_url: "http://<boomerang-express server>/beacon/0333"
```

Also feel free to use alphanumerical IDs such as:

```js
  beacon_url: "http://<boomerang-express server>/beacon/HamsterShop"
```

This still depends on the collections you've created in your database.

## Requirements

- express (http://expressjs.com)
- node-conf (https://npmjs.org/package/node-conf)
- mongodb (https://npmjs.org/package/mongodb)
- forever (https://npmjs.org/package/forever)

### Installing Requirements

Locally (recommended): 

```shell
 $> npm install .
```

Globally: 

```shell
 $> npm -g install
```

## Configuration

Configuration is defined in config/master.json

See the [setup documentation](docs/setup.md) for more information on how
to configure boomerang-express for your environment.

## Deployment

### CentOS

Installing boomerang-express on CentOS is handled using grunt.
You'll need to install the packages under devDependencies as well as the following:

 - `rpmdevtools`: tools for build rpms
 - `rpmlint`: post-build linting of rpms

Once you have these installed you'll need to run:

 - if you have all dependencies installed globally:

```shell
  $> grunt rpm
```

 - if you have all dependencies installed locally:

```shell
 $> ./node_modules/.bin/grunt rpm
```

This will build an rpm package in the project root-directory. If you have a
deployment scenario involving a local centos repository you may import the rpm
file into your repository.

---

Setting up for development and more tips visit our [development documentation](docs/index.md)
