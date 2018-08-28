var Ajv = require('ajv')
const schema = require('../schemas/invoice')

var ajv = new Ajv({allErrors: true})
var validate = ajv.compile(schema)

module.exports = function(data) {
  if(!validate(data)) {
    throw new Error('Validation error')
  }
}
