const crypto = require('../src/crypto')
const generateTransaction = require('../src/protocol').transactions.generateTransaction
const Invoice = require('../src/protocol').messages.Invoice

const idKeys = crypto.generateIdKeys()

const manifest = [
  { item: "chicken korma", quantity: 2, price: 20, tax: 12 },
  { item: "garlic naan", quantity: 6, price: 4, tax: 12 }
]

const feeProfile = {
  baseFee: 5,
  variableFee: 2,
  tax: 12,
  merchantBurden: 50
}

const transaction = generateTransaction(manifest, feeProfile)

let invoice = new Invoice({type: 'send', identityKeys: idKeys})
invoice.write(transaction.invoice)

const packet = invoice.generate()
const meta = invoice.readMeta()

console.log(packet)
console.log(meta)

let receivedInvoice = new Invoice({type: 'receive', packet: packet})
console.log(receivedInvoice.readMessage())
console.log(receivedInvoice.readMeta())
