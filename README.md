BrowserErrorConditionalForwarder
================================

Simple Browser Error Forwarding Framework with Node.js and Browserify

Features
========

 * Everything DI
 * Forwarder
 * Ignore Filter
 * Force Forward Filter

Usage
=====

```javascript
import BrowserErrorConditionalForwarder from 'browser-error-conditional-forwarder'

BrowserErrorConditionalForwarder.registerElement(
  window,
  {
    forwarder: BrowserErrorAbstractForwarder,
    ignoreFilters: [
      BrowserErrorAbstractIgnoreFilter
    ],
    forceForwardFilters: [
      BrowserErrorAbstractForceForwarderFilter
    ]
  })
```

Forwarder
----------

 * a class with `forward()` method
 * return forward status

for example `ga()` for Google Analytics tracker

```javascript
class BrowserErrorForwarder {
  forward(message, source, lineno, colno, error = undefined) {
    return ga('send', 'exception', ...)
  }
}
```

Filter
------

 * a class with `filter()` method
 * return true if filter matches

for example very early and unclear error

```javascript
class BrowserErrorIgnoreUnclearerrorFilter {
  filter(message, source, lineno, colno, error = undefined) {
    return message == 'Script error.' && lineno == 0 && colno == 0
  }
}
```
