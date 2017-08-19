import assert from 'power-assert'
import jsdom  from 'jsdom'
import sinon  from 'sinon'

const { JSDOM } = jsdom
import BrowserErrorConditionalForwarder, {
  BrowserErrorAbstractForwarder,
  BrowserErrorAbstractIgnoreFilter,
  BrowserErrorAbstractForceForwardFilter } from '../lib/browser_error_conditional_forwarder'

class BadFilterWithoutFilterMethod {}

class TestingAlwayFalseFilter {
  filter(message, source, lineno, colno, error = undefined) {
    return false
  }
}

class forwardCatcher {
  /** @var {Object} */
  captured

  /**
   * @param {String}  message
   * @param {String}  source
   * @param {Integer} lineno
   * @param {Integer} colno
   * @param {Object}  error
   * @return {Boolean}
   */
  forward(message, source, lineno, colno, error = undefined) {
    this.captured = {
      message: message,
      source:  source,
      lineno,  lineno,
      colno:   colno,
      error:   error
    }

    return true
  }
}

describe('BrowserErrorConditionalForwarder', ()=> {
  let { window } = new JSDOM('')
  let forwarder

  beforeEach(()=> {
    forwarder = BrowserErrorConditionalForwarder.registerElement(window)
  })

  describe('#registerElement', ()=> {
    let f

    describe('with opts forwarder', ()=> {
      describe('with just class', ()=> {
        beforeEach(()=> {
          f = BrowserErrorConditionalForwarder.registerElement(
            window,
            { forwarder: BrowserErrorAbstractForwarder })
        })

        it('store forwarder correctly', ()=> {
          assert.equal(BrowserErrorAbstractForwarder, f.forwarder().constructor)
        })
      })

      describe('with array', ()=> {
        it('throw TypeError', ()=> {
          assert.throws(
            ()=> {
              BrowserErrorConditionalForwarder.registerElement(
                window,
                { forwarder: [BrowserErrorAbstractForwarder] })
            },
            TypeError
          )
        })
      })
    })

    describe('with opts ignoreFilters', ()=> {
      describe('with just class', ()=> {
        beforeEach(()=> {
          f = BrowserErrorConditionalForwarder.registerElement(
            window,
            { ignoreFilters: BrowserErrorAbstractIgnoreFilter })
        })

        it('cannot handle', ()=> {
          assert.deepEqual([], f.ignoreFilters())
        })
      })

      describe('with array of class', ()=> {
        beforeEach(()=> {
          f = BrowserErrorConditionalForwarder.registerElement(
            window,
            { ignoreFilters: [BrowserErrorAbstractIgnoreFilter] })
        })

        it('accept correctly', ()=> {
          assert.deepEqual([BrowserErrorAbstractIgnoreFilter], f.ignoreFilters())
        })
      })
    })
  })

  describe('#ignoreFilters', ()=> {
    describe('empty arguments', ()=> {
      it(' return registered filters', ()=> {
        assert.deepEqual([], forwarder.ignoreFilters())
      })
    })

    describe('given one filter', ()=> {
      it('return one filter', ()=> {
        assert.equal(1, forwarder.ignoreFilters(BrowserErrorAbstractIgnoreFilter).length)
      })
    })

    describe('given one correct and one wrong filters', ()=> {
      let appended

      beforeEach(()=> {
        appended = forwarder.ignoreFilters(
          BrowserErrorAbstractIgnoreFilter,
          BadFilterWithoutFilterMethod)
      })

      it('throws InvalidFilter', ()=> {
        assert.deepEqual([BrowserErrorAbstractIgnoreFilter], forwarder.ignoreFilters())
      })
    })
  })

  describe('#forwarder', ()=> {
    describe('empty forwarder', ()=> {
      describe('no given yet', ()=> {
        it('return undefined', ()=> {
          assert.equal(undefined, forwarder.forwarder())
        })
      })

      describe('once given and empty', ()=> {
        beforeEach(()=> {
          forwarder.forwarder(BrowserErrorAbstractForwarder)
        })

        it('return added forwarder', ()=> {
          assert.equal(BrowserErrorAbstractForwarder, forwarder.forwarder().constructor)
        })
      })
    })

    describe('given forwarder', ()=> {
      describe('valid', ()=> {
        it('return forwarder', ()=> {
          assert.equal(
            BrowserErrorAbstractForwarder,
            forwarder.forwarder(BrowserErrorAbstractForwarder).constructor)
        })
      })

      describe('invalid', ()=> {
        it('return previous forwarder ( default is undefined )', ()=> {
          assert.equal(
            undefined,
            forwarder.forwarder(class {}))
        })
      })
    })
  })

  describe('#validFilter', ()=> {
    describe('abstract', ()=> {
      it('valid', ()=> {
        assert(forwarder.validFilter(BrowserErrorAbstractIgnoreFilter))
      })
    })

    describe('BadFilterWithoutFilterMethod', ()=> {
      it('invalid', ()=> {
        assert.equal(false, forwarder.validFilter(BadFilterWithoutFilterMethod))
      })
    })
  })

  describe('#shouldIgnore', ()=> {
    function subject() {
      return forwarder.shouldIgnore('message', 'source', 0, 0)
    }

    describe('no filters', ()=> {
      it('return false', ()=> {
        assert.equal(false, subject())
      })
    })

    describe('one false filter', ()=> {
      beforeEach(()=> {
        forwarder.ignoreFilters(TestingAlwayFalseFilter)
      })

      it('return false', ()=> {
        assert.equal(false, subject())
      })
    })

    describe('one true filter', ()=> {
      beforeEach(()=> {
        forwarder.ignoreFilters(BrowserErrorAbstractIgnoreFilter)
      })

      it('return true', ()=> {
        assert.equal(true, subject())
      })
    })

    describe('one false and one true filter', ()=> {
      beforeEach(()=> {
        forwarder.ignoreFilters(
          TestingAlwayFalseFilter,
          BrowserErrorAbstractIgnoreFilter)
      })

      it('return true', ()=> {
        assert.equal(true, subject())
      })
    })
  })

  describe('#process', ()=> {
    function fireSimpleError(opts = undefined) {
      window.dispatchEvent(new window.ErrorEvent('error', opts))
    }

    describe('has valid forwarder', ()=> {
      beforeEach(()=> {
        forwarder.forwarder(forwardCatcher)
      })

      describe('should ignore', ()=> {
        beforeEach(()=> {
          sinon.stub(forwarder, 'shouldIgnore').returns(true)
          fireSimpleError()
        })

        it('status false', ()=> {
          assert.equal(false, forwarder.forwardStatus())
        })
      })

      describe('should ignore and should force forward', ()=> {
        beforeEach(()=> {
          sinon.stub(forwarder, 'shouldIgnore').returns(true)
          sinon.stub(forwarder, 'shouldForceForward').returns(true)
          fireSimpleError({
            message: 'simple error',
            lineno:  0,
            colno:   0,
            error:   {}
          })
        })

        it('status true', ()=> {
          assert.equal(true, forwarder.forwardStatus())
        })

        it('forwarded error', ()=> {
          assert.deepEqual(
            {
              message: 'simple error',
              source:  '',
              lineno:  0,
              colno:   0,
              error:   {}
            },
            forwarder.forwarder().captured)
        })
      })
    })

    describe('no valid forwarder', ()=> {
      beforeEach(()=> {
        fireSimpleError()
      })

      it('forwarder is undefined', ()=> {
        assert.equal(undefined, forwarder.forwarder())
      })

      it('status false ( not undefined )', ()=> {
        assert.equal(false, forwarder.forwardStatus())
      })
    })
  })
})
