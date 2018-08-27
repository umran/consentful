const primitives = require('./primitives')

exports.generateEphemeralKeys = function(identitySecretKey) {
  var keyPair = primitives.generateSigningKeys()
  var certificate = primitives.sign(keyPair.publicKey, identitySecretKey)

  return {
    secretKey: keyPair.secretKey,
    publicKey: keyPair.publicKey,
    certificate: certificate
  }
}

exports.generateIdKeys = function() {
  return primitives.generateSigningKeys()
}

exports.verifyHash = function(data, hash) {
  const candidateHash = primitives.hash(data)
  return primitives.compare(candidateHash, hash)
}

exports.primitives = primitives
