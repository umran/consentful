const expect = require('chai').expect
const Packet = require('../../packet')
const validate = require('../validators').pickupReceipt

class PickupReceipt extends Packet {
  constructor(options) {
    super(options)

    if (options.type === 'receive') {
      this._validateMessage(this._message)
    }
  }

  // common methods
  _validateMessage(message) {

    try {
      expect(message.type).to.equal('pickupReceipt')
    } catch(err) {
      throw new Error('wrong message type')
    }

    validate(message)
  }

  // send methods

  // receive methods

}

module.exports = PickupReceipt
