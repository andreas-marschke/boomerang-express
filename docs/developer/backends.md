# Writing your own Datastore Backend

Datastore Backends take filtered and mangled data recieved from a boomerang
request and store them in a structured way inside a datastore for further
analysis.

This is a simple quick guide about the way Backends work and how you can
write your own datastore.

## How it works

`./lib/backends/index.js` is just a very thin layer around the functionality
in the backends provided underneath. All it will work with is that there is
an active datastore (i.e. `"active": "nedb"`) and a directory ccntaining an
`index.js` file underneath it that will be `require()`d

Every Backend here exposes a constructor `function()` like this:

```javascript
var Datastore = module.exports = function (options,logger) {

  // ...
  return this;
}
```

Since we will be listening on events like "open" and "dbOpenError" it would be
wise to simply "inherit" from EventEmitter.

### Configuration

Where options is the config object underneath datastore for your backend.

That means from datastore:

```json
"datastore" : {
  "active" : "nedb",
  "nedb" : {
    "directory": "./data~",
	"inMemoryOnly" : false,
	"autoload": false
  },

```

Your `options` would be:

```json
{
  "directory": "./data~",
  "inMemoryOnly" : false,
  "autoload": false
}

```
### Events (post-Construction)

#### "open"

Once you've set everything up internally and have a stable connection to your
backing store you can emit the "open" Event and pass it your object. We'll
take care of the rest for you.

#### "dbOpenError"

Should you have a problem setting up or notice something wen't wrong during setup
emit this event and we'll log and stop the service gracefully.

#### "error"

Runtime errors can happen. Stuff can get a little haywire some time. People will
try to attack this service. Don't let it kill your mood. Simply emit this event
and pass on an `Error` object with your problem.

### API Functions

These functions should be exposed with the prototype of your Backend after you've
set everything up:

#### `function` insert(type,uid,data)

_Params:_
 - `"type"`: `String` representing the type of insert we plan to make. I.e. a click
    has been sent so we pass `"click"`.
 - `"uid"`: The user-id as a `String` that was passed using the routes
 - `"data"`: an Object containing mangled flat data as it should be inserted into
   your datastore.

#### toOID(id)

_Params:_
 - `"id"`: a `String` representation of an id returned from Object insertion.

Use this create a proper ObjectID to reference in your backing store. iE. `mongodb`
has ObjectId which are slighty better than just saving the bare hashes as strings.


#### `event` emit(type + "Inserted", id )

Should you be done inserting data into your datastore you can emit an event named
like the type of data you just inserted with the string "Inserted" appended to it.

As a parameter with the event you may pass the id of the inserted element.

This is currently the way we reference the original `beacon` in our restiming objects.
