const expect = require('chai').expect
const calculateInvoice = require('../accounting').calculateInvoice

const Invoice = require('../messages').Invoice
const InvoiceReceipt = require('../messages').InvoiceReceipt
const PromiseOfPayment = require('../messages').PromiseOfPayment
const PaymentRequest = require('../messages').PaymentRequest
const EscrowContract = require('../messages').EscrowContract
const ProofOfDelivery = require('../messages').ProofOfDelivery

class TransactionChain {
  constructor(orderId, identities, paymentRequestFormConstants) {
    this._orderId = orderId
    this._identities = identities
    this._invoiceMessage = null
    this._paymentRequestForm = null
    this._metaData = {
      merchant: null,
      consumer: null,
      authority: null
    }
    this._paymentRequestFormConstants = paymentRequestFormConstants
  }

  _verifyInvoiceFields() {
    const expectedFields = calculateInvoice(this._invoiceMessage.manifest, this._invoiceMessage.feeProfile)
    Object.keys(expectedFields).forEach(key => {
      try {
        expect(expectedFields[key]).to.equal(this._invoiceMessage[key])
      } catch(err) {
        throw new Error('bad invoice field value')
      }
    })
  }

  _verifyPaymentRequestFormFields() {
    // verify form constants
    Object.keys(this._paymentRequestFormConstants).forEach(key => {
      try {
        expect(this._paymentRequestFormConstants[key]).to.equal(this._paymentRequestForm[key])
      } catch(err) {
        throw new Error('bad paymentRequestForm constant')
      }
    })

    // verify orderId, ommitted for now
    //try {
    //  expect(this._paymentRequestForm.OrderID).to.equal(this._orderId)
    //} catch(err) {
    //  throw new Error('wrong OrderID on paymentRequestForm')
    //}

    // verify amount
    try {
      expect(parseFloat(this._paymentRequestForm.PurchaseAmt)).to.equal(this._invoiceMessage.totalConsumerPaymentPostTax)
    } catch(err) {
      throw new Error('wrong PurchaseAmt on paymentRequestForm')
    }
  }

  // check invoice
  _checkInvoice() {
    // ensure that the orderId property matches with the orderId set in invoiceMessage
    expect(this._orderId).to.equal(this._invoiceMessage.orderId)

    // ensure that the invoice fields are properly calculated from the manifest
    this._verifyInvoiceFields()

    const invoicePacket = {
      header: {
        signature: this._metaData.invoice.signature,
        ephemeralPublicKey: this._metaData.invoice.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._metaData.invoice.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.merchant
      },
      body: this._invoiceMessage
    }

    // implicitly verify packet by constructing new received packet
    return new Invoice({type: 'receive', packet: invoicePacket})
  }

  // check invoiceReceipt
  _checkInvoiceReceipt() {
    let invoice = this._checkInvoice()

    const invoiceReceiptPacket = {
      header: {
        signature: this._metaData.invoiceReceipt.signature,
        ephemeralPublicKey: this._metaData.invoiceReceipt.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._metaData.invoiceReceipt.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.authority
      },
      body: {
        type: 'invoiceReceipt',
        orderId: this._orderId,
        invoice: invoice.readMeta()
      }
    }

    // implicitly verify packet by constructing new received packet
    return new InvoiceReceipt({type: 'receive', packet: invoiceReceiptPacket})
  }

  // check promiseOfPayment
  _checkPromiseOfPayment() {
    let invoiceReceipt = this._checkInvoiceReceipt()

    const promiseOfPaymentPacket = {
      header: {
        signature: this._metaData.promiseOfPayment.signature,
        ephemeralPublicKey: this._metaData.promiseOfPayment.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._metaData.promiseOfPayment.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.consumer
      },
      body: {
        type: 'promiseOfPayment',
        orderId: this._orderId,
        invoiceReceipt: invoiceReceipt.readMeta()
      }
    }

    // implicitly verify packet by constructing new received packet
    return new PromiseOfPayment({type: 'receive', packet: promiseOfPaymentPacket})
  }

  // check paymentRequest
  _checkPaymentRequest() {
    // ensure that the math in the paymentRequestForm tallies with the math in the authoritative invoice and that it references the right order
    this._verifyPaymentRequestFormFields()

    let promiseOfPayment = this._checkPromiseOfPayment()

    const paymentRequestPacket = {
      header: {
        signature: this._metaData.paymentRequest.signature,
        ephemeralPublicKey: this._metaData.paymentRequest.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._metaData.paymentRequest.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.authority
      },
      body: {
        type: 'paymentRequest',
        orderId: this._orderId,
        promiseOfPayment: promiseOfPayment.readMeta(),
        paymentRequestForm: this._paymentRequestForm
      }
    }

    // implicitly verify packet by constructing new received packet
    return new PaymentRequest({type: 'receive', packet: paymentRequestPacket})
  }

  // check escrowContract
  _checkEscrowContract() {
    let paymentRequest = this._checkPaymentRequest()

    const escrowContractPacket = {
      header: {
        signature: this._metaData.escrowContract.signature,
        ephemeralPublicKey: this._metaData.escrowContract.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._metaData.escrowContract.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.authority
      },
      body: {
        type: 'escrowContract',
        orderId: this._orderId,
        paymentRequest: paymentRequest.readMeta()
      }
    }

    // implicitly verify packet by constructing new received packet
    return new EscrowContract({type: 'receive', packet: escrowContractPacket})
  }

  // check proofOfDelivery
  _checkProofOfDelivery() {
    let escrowContract = this._checkEscrowContract()

    const proofOfDeliveryPacket = {
      header: {
        signature: this._metaData.proofOfDelivery.signature,
        ephemeralPublicKey: this._metaData.proofOfDelivery.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._metaData.proofOfDelivery.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.consumer
      },
      body: {
        type: 'proofOfDelivery',
        orderId: this._orderId,
        escrowContract: escrowContract.readMeta()
      }
    }

    // implicitly verify packet by constructing new received packet
    return new ProofOfDelivery({type: 'receive', packet: proofOfDeliveryPacket})
  }

  setInvoice(invoiceMeta, invoiceMessage) {
    this._metaData.invoice = invoiceMeta
    this._invoiceMessage = invoiceMessage
  }

  setInvoiceReceipt(invoiceReceiptMeta) {
    this._metaData.invoiceReceipt = invoiceReceiptMeta
  }

  setPromiseOfPayment(promiseOfPaymentMeta) {
    this._metaData.promiseOfPayment = promiseOfPaymentMeta
  }

  setPaymentRequest(paymentRequestMeta, paymentRequestForm) {
    this._metaData.paymentRequest = paymentRequestMeta
    this._paymentRequestForm = paymentRequestForm
  }

  setEscrowContract(escrowContractMeta) {
    this._metaData.escrowContract = escrowContractMeta
  }

  setProofOfDelivery(proofOfDeliveryMeta) {
    this._metaData.proofOfDelivery = proofOfDeliveryMeta
  }

  checkInvoice() {
    return this._checkInvoice()
  }

  checkInvoiceReceipt() {
    return this._checkInvoiceReceipt()
  }

  checkPromiseOfPayment() {
    return this._checkPromiseOfPayment()
  }

  checkPaymentRequest() {
    return this._checkPaymentRequest()
  }

  checkEscrowContract() {
    return this._checkEscrowContract()
  }

  checkProofOfDelivery() {
    return this._checkProofOfDelivery()
  }
}

module.exports = TransactionChain
