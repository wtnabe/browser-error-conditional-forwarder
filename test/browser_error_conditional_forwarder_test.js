import assert from 'power-assert'
import jsdom  from 'jsdom'
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

describe('BrowserErrorConditionalForwarder', ()=> {
  let { window } = new JSDOM('')
  let forwarder

  beforeEach(()=> {
    forwarder = BrowserErrorConditionalForwarder.registerElement(window)
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
})
