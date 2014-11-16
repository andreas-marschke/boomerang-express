# MongoDB Backend

This document describes the boomerang-express storage backend for mongodb, how
to configure it and how it works.

## What is it?

The mongodb backend filters and stores incoming beacons in a mongodb database.
This database may then be queried for the beacon data and evaluated in the
context you require it in.

## How it Works

Once boomerang-express has filtered through the requested data and formed a
filtered version of what has been sent to the beacon-server, the backend takes
over and uses the data to check against the database to see if the beacon data
is allowed to be saved in mongodb. For this two(2) collections have to be added
to the mongodb database:

- users: a collection to hold the usernames and where they came from
- collections: a collection describing the sites and their allowed beacon data
  to be stored in the database

### `db.users` collection

A document in the `users` collection may look like this:

```json
{
  "_id" : "54579344c",
  "name" : "amarschke",
  "via" : "ldapauth"
}
```

where the keys and values are to be understood as so:

- `_id`: The mongodb unique `_id` of the document. The string representation of this
  field will be the later link between the collections and the user
- `name`: The username that was used to login at an eventual frontend
- `via`: authentication source the user came from. This is interesting to youf
you want to use multiple autentication sources to your frontend to exist.

### `db.webcollections` collection

Here a document may look like this:

```json
{
  "_id" : ObjectId("545b56eb09094bbcaba8ad4f"),
  "types" : [
    "beacon"
  ],
  "name" : "demo-webpage",
  "owner" : "54579344cbf7586a01f06d37",
  "locations" : [
    {
      "url" : "http://localhost:4000",
      "shared" : false
    }
  ]
}
```

This collection and existance of documents in that collection are *mandatory*
for a working system.

Here the configuration works like this:

- `_id`: The mongodb unique `_id` of the document
- `types`: `Array` of `String`s that describe the allowed types of metrics to
store in the database
- `name`: The name of the collection i.e. Site this set of metrics will be
referenced by.
- `owner`: As mentioned above the string representation of the id of the user
this collection is owned by
- `locations`: An `Array` of `Object`s containing the keys:
  - `url`: The URL Referrer from which the beacon was issued from
  - `shared`: boolean determinig if the `url`value should be taken literally and
  matched from its host against the incoming beacon or if the URL points to a
  shared hosted solution where your site may only be a small part of the overall
  sites. If it is true boomerang-express expects the url to contain an asterisk(`*`)
  at which deviations may occur and the rest of the URL (Host and Path and Paramters
  if applicable) are matched against a the incoming beacon.

## Configuration

The `mongodb` backend is configured using the `config/master.json` configuration-file.
All configuration for this backend resides underneath the top "datastore" object.

A valid configuration may look like this:

```json
"datastore" : {
  "active" : "mongodb",
  "mongodb" : {
    "db" : "boomerang",
	"options" : {
  	  "poolSize": 5,
	  "buffer": -1
	},
	"server" : {
	  "host" : "mongodb.example.org",
	  "port" : 27017,
	  "secure": false
	}
  }
}
```

#### `datastore.active`
`String` representation of the currently active datastore backend

If none is given boomerang-express will shut down and end the process.

#### `datastore.mongodb.db`
`String` name of the database on your mongodb instance that will hold your data.

Default: `"test"`

#### `datastore.mongodb.options.poolSize`
`Number` of pooled connections to your mongodb you wish to keep open at all times
to send data to your server to.

Default: `5`

#### `datastore.mongodb.options.buffer`
`Number` of buffered operations (reads,writes) to your mongodb instance before failing
because no working connection has been established. If you work on a less reliable operation
basis or connections to your mongodb may break during operation (ie. boomerang-express-server
and datastore are on different-sites connected through the internet with a vpn/mpls) you may
use this to still get your beacon data to the mongodb store at a "later" point.

Default: `100`

#### `datastore.mongodb.server.host`
`String` hostname to which to connect as the mongodb host.

Default: `localhost`

#### `datastore.mongodb.server.port`
Port `Number` on which the mongodb instance listens to.

Default: `27017`

#### `datastore.mongodb.server.secure`
`Object` containing secure configuration for your mongodb instance.

If you do not use a secure connection to your mongodb instance you may set `"secure"` to `false`.

An example configuration for a secure connection may look like this:

```json
"secure": {
  "ca": "/path/to/cert.ca",
  "key": "/path/to/cert.key",
  "pass": "password"
}
```

The meaning of these configuration options are:

##### `secure.ca`
`String` of an absolute path to the `*.pem` file certificate of the Certificate Authority

Default: `null`

##### `secure.key`
`String` of an absolute path to the `*.pem` file containing the SSL certificate and key
for the connection.

Default: `null`

##### `secure.pass`
`String` password in cleartext for the certificate key

