const crypto = require('../src/crypto')
const protocol = require('../src/protocol')
const utilities = require('../src/utilities')

exports.setPRNG = function(PRNG) {
  crypto.primitives.setPRNG(PRNG)
}

exports.crypto = crypto
exports.protocol = protocol
exports.utilities = utilities
