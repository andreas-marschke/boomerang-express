# Boomerang-Express

> Choo Choo

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
        beacon_url: "http://<boomerang-express server>/beacon/0000",      
        DNS : {
          base_url: "http://<boomerang-express server>/"
        }, 
        RT: {
          cookie: "cookie-rt", 
          strict_referrer: false
        },
        BW: {
          base_url: "http://<boomerang-express server>/",
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
from the evaluation previously described tests. boomerang-express will
save this data together with the Customer Identification Number (here
`0000`) into the mongodb under the `beacon-0000` collection.

If you have more than one customer you'd like to manage add a
different ID to each of the beacon-urls like 

```js
  beacon_url: "http://<boomerang-express server>/beacon/0333"
```

Also feel free to use alphanumerical IDs such as:

```js
  beacon_url: "http://<boomerang-express server>/beacon/HamsterShop"
```

## Requirements

- express (http://expressjs.com)
- node-conf (https://npmjs.org/package/node-conf)
- mongodb (https://npmjs.org/package/mongodb)
- forever (https://npmjs.org/package/forever)

### Installing Requirements

Locally (recommended): 

```shell
 $> npm install 
```

Globally: 

```shell
 $> npm -g install
```

## Configuration

Configuration is defined in config/master.json

```
{
    // Configuration data for the server
    "server": {
	    // IPs and ports to listen on currently supports http and https
		"listeners" : [
	    	{
		    	"protocol" : "http",
		    	"port" : "4000",
		    	"listen" : "127.0.0.1",
				// should the client request a url that is not in the routes list
				// it will be redirected to the redir-URL
		    	"redir" : "http://www.afterbuy.de"  
	    	},
	    	{
		    	"protocol" : "https",
		    	"key" : "./config/localhost.key",
		    	"cert" : "./config/localhost.cert",
		    	"port" : "4443",
		    	"listen" : "127.0.0.1",
		    	"redir" : "http://www.afterbuy.de"
	    	}
		]
    },
	// Configuration data for the MongoDB Server
    "mongodb" : {
	    // Database to open
	    "db" : "boomerang",
		// Parameters for the connection 
		// See: http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#the-url-connection-format
		"options" : "maxPoolSize=100&journal=true",
		// Username and Password to use for authentication (Mandatory!)
		// See:	http://docs.mongodb.org/manual/tutorial/enable-authentication/
		// And: http://docs.mongodb.org/manual/tutorial/enable-authentication-in-sharded-cluster/
		"credentials" : {
	    	"user" : "root",
	    	"password" : "2kimpler96"
		},
		// List of Servers to connect to requires host (domainname or
		// IP) and port
		"servers" : [
	    	{
				"host" : "mongodb-01.andreas-marschke.name",
				"port" : 27017
	    	}
		]
    }
}

```

## Deployment

If you wish to use boomerang-express in production you can use the
Makefile supplied with this distribution to install the init-scripts
and default configuration file for the forever server that will host
the express.js application. 

Unless you have installed all dependencies for boomerang-express prior
to installing boomerang-express using a package management system you
can install boomerang-express using `make install`. 

After modifying master.json to meet your requirement you can start the
server using:

```
$> /etc/init.d/boomerang-express start
```
This will start the server listening on the IP adress you've
configured in boomerang for the servers. 

