const encoders = require('../src/utilities').encoders
const crypto = require('../src/crypto')
const generateTransaction = require('../src/protocol').transactions.generateTransaction
const TransactionChain = require('../src/protocol').transactions.TransactionChain

const Invoice = require('../src/protocol').messages.Invoice
const InvoiceReceipt = require('../src/protocol').messages.InvoiceReceipt
const PromiseOfPayment = require('../src/protocol').messages.PromiseOfPayment
const PaymentRequest = require('../src/protocol').messages.PaymentRequest
const EscrowContract = require('../src/protocol').messages.EscrowContract
const ProofOfDelivery = require('../src/protocol').messages.ProofOfDelivery

// create identities
const Merchant = crypto.generateIdKeys()
const Consumer = crypto.generateIdKeys()
const Authority = crypto.generateIdKeys()

// feeProfileConstants
const feeProfileConstants = {
  baseFee: 10,
  variableFee: 3,
  tax: 12
}

// paymentRequestFormConstants
const paymentRequestFormConstants = {
  Version: '1.1',
  SignatureMethod: 'SHA1',
  MerRespURL: 'https://gateway.consentful.io/response',
  MerID: '12223243443',
  AcqID: '54432345454',
  PurchaseCurrency: '462',
  PurchaseCurrencyExponent: '2',
}

// Merchant generates the transaction and creates the invoice
const manifest = [
  { item: "chicken korma", quantity: 2, price: 20, tax: 12 },
  { item: "garlic naan", quantity: 6, price: 4, tax: 12 }
]

const feeProfile = {
  baseFee: 10,
  variableFee: 3,
  tax: 12,
  merchantBurden: 50
}

const transaction = generateTransaction(manifest, feeProfile)

let invoice = new Invoice({type: 'send', identityKeys: Merchant})
invoice.write(transaction.invoice)
const invoicePacket = invoice.generate()
console.log(JSON.stringify(invoicePacket))

// Authority verifies and validates the invoice, then creates an InvoiceReceipt using the invoice meta data
let receivedInvoice = new Invoice({type: 'receive', packet: invoicePacket})
const receivedInvoiceMessage = receivedInvoice.readMessage()
const receivedInvoiceMeta = receivedInvoice.readMeta()

const invoiceReceiptMessage = {
  type: 'invoiceReceipt',
  orderId: receivedInvoiceMessage.orderId,
  invoice: receivedInvoiceMeta,
  timestamp: new Date().toISOString()
}

let invoiceReceipt = new InvoiceReceipt({type: 'send', identityKeys: Authority})
invoiceReceipt.write(invoiceReceiptMessage)
const invoiceReceiptPacket = invoiceReceipt.generate()
console.log(JSON.stringify(invoiceReceiptPacket))

// Consumer verifies and validates the invoiceReceipt, then creates a PromiseOfPayment using the invoiceReceipt meta data
let receivedInvoiceReceipt = new InvoiceReceipt({type: 'receive', packet: invoiceReceiptPacket})
const receivedInvoiceReceiptMessage = receivedInvoiceReceipt.readMessage()
const receivedInvoiceReceiptMeta = receivedInvoiceReceipt.readMeta()

const promiseOfPaymentMessage = {
  type: 'promiseOfPayment',
  orderId: receivedInvoiceReceiptMessage.orderId,
  invoiceReceipt: receivedInvoiceReceiptMeta,
  timestamp: new Date().toISOString()
}

let promiseOfPayment = new PromiseOfPayment({type: 'send', identityKeys: Consumer})
promiseOfPayment.write(promiseOfPaymentMessage)
const promiseOfPaymentPacket = promiseOfPayment.generate()
console.log(JSON.stringify(promiseOfPaymentPacket))

// Authority verifies and validates the promiseOfPayment, then creates a PaymentRequest using the promiseOfPayment meta data
let receivedPromiseOfPayment = new PromiseOfPayment({type: 'receive', packet: promiseOfPaymentPacket})
const receivedPromiseOfPaymentMessage = receivedPromiseOfPayment.readMessage()
const receivedPromiseOfPaymentMeta = receivedPromiseOfPayment.readMeta()

const paymentRequestForm = {
  Version: '1.1',
  SignatureMethod: 'SHA1',
  MerRespURL: 'https://gateway.consentful.io/response',
  MerID: '12223243443',
  AcqID: '54432345454',
  PurchaseCurrency: '462',
  PurchaseCurrencyExponent: '2',
  OrderID: receivedPromiseOfPaymentMessage.orderId,
  PurchaseAmt: receivedInvoiceMessage.totalConsumerPaymentPostTax.toString(),
  Signature: 'somebullshitBMLsignature1234'
}

const paymentRequestMessage = {
  type: 'paymentRequest',
  orderId: receivedPromiseOfPaymentMessage.orderId,
  promiseOfPayment: receivedPromiseOfPaymentMeta,
  paymentRequestForm: paymentRequestForm,
  timestamp: new Date().toISOString()
}

let paymentRequest = new PaymentRequest({type: 'send', identityKeys: Authority})
paymentRequest.write(paymentRequestMessage)
const paymentRequestPacket = paymentRequest.generate()
console.log(JSON.stringify(paymentRequestPacket))

// Authority verifies and validates the paymentRequest, then creates an EscrowContract using the promiseOfPayment meta data
let receivedPaymentRequest = new PaymentRequest({type: 'receive', packet: paymentRequestPacket})
const receivedPaymentRequestMessage = receivedPaymentRequest.readMessage()
const receivedPaymentRequestMeta = receivedPaymentRequest.readMeta()

const escrowContractMessage = {
  type: 'escrowContract',
  orderId: receivedPaymentRequestMessage.orderId,
  paymentRequest: receivedPaymentRequestMeta,
  timestamp: new Date().toISOString()
}

let escrowContract = new EscrowContract({type: 'send', identityKeys: Authority})
escrowContract.write(escrowContractMessage)
const escrowContractPacket = escrowContract.generate()
console.log(JSON.stringify(escrowContractPacket))

// Consumer verifies and validates the escrowContract, then creates a ProofOfDelivery using the escrowContract meta data
let receivedEscrowContract = new EscrowContract({type: 'receive', packet: escrowContractPacket})
const receivedEscrowContractMessage = receivedEscrowContract.readMessage()
const receivedEscrowContractMeta = receivedEscrowContract.readMeta()

const proofOfDeliveryMessage = {
  type: 'proofOfDelivery',
  orderId: receivedEscrowContractMessage.orderId,
  escrowContract: receivedEscrowContractMeta,
  timestamp: new Date().toISOString()
}

let proofOfDelivery = new ProofOfDelivery({type: 'send', identityKeys: Consumer})
proofOfDelivery.write(proofOfDeliveryMessage)
const proofOfDeliveryPacket = proofOfDelivery.generate()
console.log(JSON.stringify(proofOfDeliveryPacket))

// Authority verifies and validates the proofOfDelivery, then sends the money to merchant
let receivedProofOfDelivery = new ProofOfDelivery({type: 'receive', packet: proofOfDeliveryPacket})
let receivedProodOfDeliveryMessage = receivedProofOfDelivery.readMessage()
let receivedProofOfDeliveryMeta = receivedProofOfDelivery.readMeta()

// create transaction chain
/*const chain = new TransactionChain(transaction.orderId, {
  merchant: encoders.byteArrayToB64(Merchant.publicKey),
  consumer: encoders.byteArrayToB64(Consumer.publicKey),
  authority: encoders.byteArrayToB64(Authority.publicKey)
}, feeProfileConstants, paymentRequestFormConstants)

chain.setInvoice(receivedInvoiceMeta, receivedInvoiceMessage)
chain.setInvoiceReceipt(receivedInvoiceReceiptMeta)
chain.setPromiseOfPayment(receivedPromiseOfPaymentMeta)
chain.setPaymentRequest(receivedPaymentRequestMeta, receivedPaymentRequestMessage.paymentRequestForm)
chain.setEscrowContract(receivedEscrowContractMeta)
chain.setProofOfDelivery(receivedProofOfDeliveryMeta)

chain.checkProofOfDelivery()*/
