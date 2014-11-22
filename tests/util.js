/* mock logger to to prevent excessive logging to the console */

module.exports = {
    "trace": function() {},
    "debug": function() {},
    "info": function() {},
    "warn": function() {},
    "error": function() {},
    "fatal": function() {},
    "critical": function() {}
};
