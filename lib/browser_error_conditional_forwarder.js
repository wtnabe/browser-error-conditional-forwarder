class BrowserErrorConditionalForwarder {
  /** @const {Object} */
  _ele
  /** @var {Array} */
  _ignoreFilters       = []
  /** @var {Array} */
  _forceForwardFilters = []
  /** @var {Object} */
  _forwarder
  /** @var {Boolean} */
  _forwardStatus

  /**
   * @param  {DOMObject} element
   * @param  {Object}    opts
   * @return {this}
   */
  static registerElement(element, opts = {}) {
    let self = new this()

    if ( opts && Object.keys(opts).length > 0 ) {
      if ( typeof opts['forwarder'] != 'undefined' ) {
        self.forwarder(opts['forwarder'])
      }
      if ( typeof opts['ignoreFilters'] != 'undefined' ) {
        self.ignoreFilters.apply(self, opts['ignoreFilters'])
      }
      if ( typeof opts['forceForwardFilters'] != 'undefined' ) {
        self.forceForwardFilters.apply(self, opts['forceForwardFilters'])
      }
    }

    self.element(element)

    element.addEventListener('error', (e)=> {
      self.process(e.message, e.filename, e.lineno, e.colno, e.error)
    })

    return self
  }

  /**
   * @param  {Object} element
   * @return {Object}
   */
  element(element = null) {
    if ( element ) {
      this._ele = element
    }

    return this._ele
  }

  /**
   * @param  {Array} filters
   * @return {Array}
   */
  ignoreFilters() {
    if ( arguments.length > 0 ) {
      let filters = Array.prototype.slice.call(arguments)

      this._addFilters(this._ignoreFilters, filters)
    }

    return this._ignoreFilters
  }

  /**
   * @param  {Array} filters
   * @return {Array}
   */
  forceForwardFilters() {
    if ( arguments.length > 0 ) {
      let filters = Array.prototype.slice.call(arguments)

      this._addFilters(this._forceForwardFilters, filters)
    }

    return this._forceForwardFilters
  }

  /**
   * @private
   * @param  {String} category
   * @param  {Array}  filters
   * @return {Array}
   */
  _addFilters(property, filters) {
    filters.forEach((filter) => {
      let instance = this.validFilter(filter)
      if ( instance ) {
        property.push(instance)
      } else if ( typeof console != 'undefined' ) {
        console.log(`${filter.name} does not have filter() function`) // eslint-disable-line no-console
      }
    })
  }

  /**
   * @param  {Object}
   * @return {mixed}
   */
  validFilter(filterClass) {
    let filter = new filterClass()

    return ( typeof filter.filter == 'function' ) ? filter : false
  }

  /**
   * @param  {Object} forwarder
   * @return {Object}
   */
  forwarder(forwarder = undefined) {
    if ( forwarder ) {
      let f = new forwarder()
      if ( typeof f.forward == 'function' ) {
        this._forwarder = f
      }
    }

    return this._forwarder
  }

  /**
   * @return {Boolean}
   */
  forwardStatus() {
    return this._forwardStatus
  }

  /**
   * @param {String}  message
   * @param {String}  source
   * @param {Integer} lineno
   * @param {Integer} colno
   * @param {Object}  error
   */
  shouldIgnore(message, source, lineno, colno, error = undefined) {
    return this.ignoreFilters().some((filter)=> {
      return filter.filter(message, source, lineno, colno, error)
    })
  }

  /**
   * @param {String}  message
   * @param {String}  source
   * @param {Integer} lineno
   * @param {Integer} colno
   * @param {Object}  error
   */
  shouldForceForward(message, source, lineno, colno, error = undefined) {
    return this.forceForwardFilters().some((filter)=> {
      return filter.filter(message, source, lineno, colno, error)
    })
  }

  /**
   * @param {String}  message
   * @param {String}  source
   * @param {Integer} lineno
   * @param {Integer} colno
   * @param {Object}  error
   */
  process(message, source, lineno, colno, error = undefined) {
    if ( this.forwarder() ) {
      if ( this.shouldForceForward(message, source, lineno, colno, error) ||
           !this.shouldIgnore(message, source, lineno, colno, error) ) {
        this._forwardStatus = this.forwarder().forward(message, source, lineno, colno, error)
      } else {
        this._forwardStatus = false
      }
    } else {
      this._forwardStatus = false
    }
  }
}

class BrowserErrorAbstractForwarder {
  /**
   * @param  {String}  message
   * @param  {String}  source
   * @param  {Integer} lineno
   * @param  {Integer} colno
   * @param  {Object}  error
   * @return {Boolean}
   */
  forward(message, source, lineno, colno, error = undefined) { // eslint-disable-line no-unused-vars
  }
}

class BrowserErrorAbstractIgnoreFilter {
  /**
   * @param  {String}  message
   * @param  {String}  source
   * @param  {Integer} lineno
   * @param  {Integer} colno
   * @param  {Object}  error
   * @return {Boolean}
   */
  filter(message, source, lineno, colno, error = undefined) { // eslint-disable-line no-unused-vars
    return true
  }
}

class BrowserErrorAbstractForceForwardFilter {
  /**
   * @param  {String}  message
   * @param  {String}  source
   * @param  {Integer} lineno
   * @param  {Integer} colno
   * @param  {Object}  error
   * @return {Boolean}
   */
  filter(message, source, lineno, colno, error = undefined) { // eslint-disable-line no-unused-vars
    return true
  }
}

export { BrowserErrorConditionalForwarder as default, BrowserErrorAbstractForwarder, BrowserErrorAbstractIgnoreFilter, BrowserErrorAbstractForceForwardFilter }
