const calculateInvoice = require('../src/protocol/accounting/calculateInvoice')

const manifest = [
  {
    item: 'Pizza',
    price: 103,
    quantity: 1.5,
    tax: 12
  },
]

const feeProfile = {
  baseFee: 5,
  variableFee: 2,
  tax: 12,
  merchantBurden: 60
}

const computed = calculateInvoice(manifest, feeProfile)
console.log(computed)
