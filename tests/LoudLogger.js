"use strict";
/* mock logger to to prevent excessive logging to the console */

module.exports = {
  "trace": console.trace,
  "debug": console.trace,
  "info": console.trace,
  "warn": console.trace,
  "error": console.trace,
  "fatal": console.trace,
  "critical": console.trace
};
