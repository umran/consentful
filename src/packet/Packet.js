const encoders = require('../utilities/encoders')
const crypto = require('../crypto')
const validate = require('./packetValidator')

class Packet {
  constructor(options) {
    if(options.type === 'send') {
      this._identityPublicKey = options.identityKeys.publicKey
      this._ephemeralKeys = crypto.generateEphemeralKeys(options.identityKeys.secretKey)
    }
    else if (options.type === 'receive') {
      this._packet = options.packet
      this._validatePacket()
      this._verifyPacket()
      this._setMeta(this._packet.header)
      this._setMessage(this._packet.body)
    }
    else {
      throw new Error('Unrecognized message type')
    }
  }

  // common methods
  _setMessage(message) {
    this._message = message
  }

  _getMessage() {
    return this._message
  }

  _setMeta(header) {
    this._meta = {
      signature: header.signature,
      ephemeralPublicKey: header.ephemeralPublicKey,
      ephemeralPublicKeyCertificate: header.ephemeralPublicKeyCertificate,
      identityPublicKey: header.identityPublicKey
    }
  }

  _getMeta() {
    return this._meta
  }

  _validatePacket() {
    // validation rules go here. throw error if invalid
    validate(this._packet)
  }

  _validateMessage(message) {
    throw new Error('Child class must implement method')
  }

  readMeta() {
    return this._getMeta()
  }

  _verifyPacket() {
    // verify ephemeral public key
    const ephemeralPublicKey = encoders.b64ToByteArray(this._packet.header.ephemeralPublicKey)
    const ephemeralPublicKeyCertificate = encoders.b64ToByteArray(this._packet.header.ephemeralPublicKeyCertificate)
    const identityPublicKey = encoders.b64ToByteArray(this._packet.header.identityPublicKey)

    const ephemeralPublicKeyVerification = crypto.primitives.verifySignature(ephemeralPublicKey, ephemeralPublicKeyCertificate, identityPublicKey)

    if(!ephemeralPublicKeyVerification) {
      throw new Error('Ephemeral public key verification failed')
    }

    // verify message
    var message = JSON.stringify(this._packet.body)
    message = encoders.stringToByteArray(message)
    const signature = encoders.b64ToByteArray(this._packet.header.signature)

    const messageVerification = crypto.primitives.verifySignature(message, signature, ephemeralPublicKey)

    if(!messageVerification) {
      throw new Error('Message verification failed')
    }
  }

  // send methods

  _signMessage() {
    var message = JSON.stringify(this._message)
    message = encoders.stringToByteArray(message)

    return crypto.primitives.sign(message, this._ephemeralKeys.secretKey)
  }

  _generateHeader() {
    const headers = {
      signature: this._signMessage(),
      ephemeralPublicKey: this._ephemeralKeys.publicKey,
      ephemeralPublicKeyCertificate: this._ephemeralKeys.certificate,
      identityPublicKey: this._identityPublicKey
    }

    return Object.keys(headers).reduce((result, key) => {
      result[key] = encoders.byteArrayToB64(headers[key])
      return result
    }, {})
  }

  _generateBody() {
    return this._message
  }

  _packetize() {
    const header = this._generateHeader()
    const body = this._generateBody()

    this._packet = {
      header: header,
      body: body
    }
  }

  write(message) {
    this._validateMessage(message)
    this._setMessage(message)
  }

  generate() {
    this._packetize()
    this._validatePacket()
    this._verifyPacket()
    this._setMeta(this._packet.header)
    return this._packet
  }

  // receive methods

  readMessage() {
    return this._getMessage()
  }
}

module.exports = Packet
