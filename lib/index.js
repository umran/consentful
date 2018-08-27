const crypto = require('../src/crypto')
const protocol = require('../src/protocol')

exports.setPRNG = function(PRNG) {
  crypto.primitives.setPRNG(PRNG)
}

exports.protocol = protocol
