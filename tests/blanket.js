"use strict";

var path = require("path");

var libdir = path.join(__dirname, "..", "lib");
require("blanket")({
    pattern: libdir
});
