var Ajv = require('ajv')
const schema = require('./packetSchema.json')

var ajv = new Ajv({allErrors: true})
var validate = ajv.compile(schema)

module.exports = function(data) {
  if(!validate(data)) {
    console.log(validate.errors)
    throw new Error('Validation error')
  }
}
