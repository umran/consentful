const primitives = require('../crypto').primitives
const encoders = require('./encoders')

module.exports = function() {
  const bytes = primitives.randomBytes(32)
  return encoders.byteArrayToB64(bytes)
}
