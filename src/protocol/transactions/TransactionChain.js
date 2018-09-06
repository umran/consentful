const expect = require('chai').expect
const calculateInvoice = require('../accounting').calculateInvoice

const Invoice = require('../messages').Invoice
const InvoiceReceipt = require('../messages').InvoiceReceipt
const PromiseOfPayment = require('../messages').PromiseOfPayment
const PaymentRequest = require('../messages').PaymentRequest
const PickupRequest = require('../messages').PickupRequest
const PickupReceipt = require('../messages').PickupReceipt
const EscrowContract = require('../messages').EscrowContract
const ProofOfDelivery = require('../messages').ProofOfDelivery
const MerchantDispute = require('../messages').MerchantDispute
const DisputeReceipt = require('../messages').DisputeReceipt
const MerchantCancellation = require('../messages').MerchantCancellation
const ConsumerCancellation = require('../messages').ConsumerCancellation

class TransactionChain {
  constructor(orderId, identities, feeProfileConstants, paymentRequestFormConstants) {
    this._orderId = orderId
    this._identities = identities
    this._messages = {
      invoice: null,
      invoiceReceipt: null,
      promiseOfPayment: null,
      paymentRequest: null,
      escrowContract: null,
      pickupRequest: null,
      pickupReceipt: null,
      proofOfDelivery: null,
      merchantDispute: null,
      disputeReceipt: null,
      merchantCancellation: null,
      consumerCancellation: null
    }
    this._feeProfileConstants = feeProfileConstants
    this._paymentRequestFormConstants = paymentRequestFormConstants
  }

  // utility methods

  _generateInvoiceBody(invoice) {
    const calculatedFields = calculateInvoice(invoice.manifest, invoice.feeProfile)

    const body = {
      type: 'invoice',
      delivery: invoice.delivery,
      orderId: this._orderId,
      manifest: invoice.manifest,
      manifestTotalPreTax: calculatedFields.manifestTotalPreTax,
      manifestTotalPostTax: calculatedFields.manifestTotalPostTax,
      feeProfile: invoice.feeProfile,
      feeTotalPreTax: calculatedFields.feeTotalPreTax,
      feeTotalPostTax: calculatedFields.feeTotalPostTax,
      feeMerchantPreTax: calculatedFields.feeMerchantPreTax,
      feeMerchantPostTax: calculatedFields.feeMerchantPostTax,
      feeConsumerPreTax: calculatedFields.feeConsumerPreTax,
      feeConsumerPostTax: calculatedFields.feeConsumerPostTax,
      totalMerchantPaymentPreTax: calculatedFields.totalMerchantPaymentPreTax,
      totalMerchantPaymentPostTax: calculatedFields.totalMerchantPaymentPostTax,
      totalConsumerPaymentPreTax: calculatedFields.totalConsumerPaymentPreTax,
      totalConsumerPaymentPostTax: calculatedFields.totalConsumerPaymentPostTax,
      timestamp: invoice.timestamp
    }

    return body
  }

  _verifyTimestamp(current, previous) {
    if (current - previous < 0) {
      throw new Error('bad timestamp')
    }
  }

  _verifyInvoiceFields() {
    // verify feeProfile constants
    Object.keys(this._feeProfileConstants).forEach(key => {
      try {
        expect(this._feeProfileConstants[key]).to.equal(this._messages.invoice.body.feeProfile[key])
      } catch(err) {
        throw new Error('bad feeProfile constant')
      }
    })
  }

  _verifyPaymentRequestFormFields() {
    // verify form constants
    Object.keys(this._paymentRequestFormConstants).forEach(key => {
      try {
        expect(this._paymentRequestFormConstants[key]).to.equal(this._messages.paymentRequest.paymentRequestForm[key])
      } catch(err) {
        throw new Error('bad paymentRequestForm constant')
      }
    })

    // verify orderId, must be modified to include unique attempt number
    try {
      expect(this._messages.paymentRequest.paymentRequestForm.OrderID).to.equal(this._orderId)
    } catch(err) {
      throw new Error('wrong OrderID on paymentRequestForm')
    }

    // verify amount
    try {
      expect(parseFloat(this._messages.paymentRequest.paymentRequestForm.PurchaseAmt)).to.equal(this._messages.invoice.body.totalConsumerPaymentPostTax)
    } catch(err) {
      throw new Error('wrong PurchaseAmt on paymentRequestForm')
    }
  }

  // linear transaction chain messages

  // check invoice
  _checkInvoice() {
    // ensure that the orderId property matches with the orderId set in invoiceMessage
    expect(this._orderId).to.equal(this._messages.invoice.orderId)

    // ensure that the invoice fields are properly calculated from the manifest
    this._verifyInvoiceFields()

    const invoicePacket = {
      header: {
        signature: this._messages.invoice.meta.signature,
        ephemeralPublicKey: this._messages.invoice.meta.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._messages.invoice.meta.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.merchant
      },
      body: this._messages.invoice.body
    }

    // implicitly verify packet by constructing new received packet
    return new Invoice({type: 'receive', packet: invoicePacket})
  }

  // check invoiceReceipt
  _checkInvoiceReceipt() {
    this._verifyTimestamp(this._messages.invoiceReceipt.timestamp, this._messages.invoice.timestamp)

    const invoice = this._checkInvoice()

    const invoiceReceiptPacket = {
      header: {
        signature: this._messages.invoiceReceipt.meta.signature,
        ephemeralPublicKey: this._messages.invoiceReceipt.meta.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._messages.invoiceReceipt.meta.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.authority
      },
      body: {
        type: 'invoiceReceipt',
        orderId: this._orderId,
        invoice: invoice.readMeta(),
        timestamp: this._messages.invoiceReceipt.timestamp
      }
    }

    // implicitly verify packet by constructing new received packet
    return new InvoiceReceipt({type: 'receive', packet: invoiceReceiptPacket})
  }

  // check promiseOfPayment
  _checkPromiseOfPayment() {
    this._verifyTimestamp(this._messages.promiseOfPayment.timestamp, this._messages.invoiceReceipt.timestamp)

    const invoiceReceipt = this._checkInvoiceReceipt()

    const promiseOfPaymentPacket = {
      header: {
        signature: this._messages.promiseOfPayment.meta.signature,
        ephemeralPublicKey: this._messages.promiseOfPayment.meta.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._messages.promiseOfPayment.meta.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.consumer
      },
      body: {
        type: 'promiseOfPayment',
        orderId: this._orderId,
        invoiceReceipt: invoiceReceipt.readMeta(),
        timestamp: this._messages.promiseOfPayment.timestamp
      }
    }

    // implicitly verify packet by constructing new received packet
    return new PromiseOfPayment({type: 'receive', packet: promiseOfPaymentPacket})
  }

  // check paymentRequest
  _checkPaymentRequest() {
    this._verifyTimestamp(this._messages.paymentRequest.timestamp, this._messages.promiseOfPayment.timestamp)

    // ensure that the math in the paymentRequestForm tallies with the math in the authoritative invoice and that it references the right order
    this._verifyPaymentRequestFormFields()

    const promiseOfPayment = this._checkPromiseOfPayment()

    const paymentRequestPacket = {
      header: {
        signature: this._messages.paymentRequest.meta.signature,
        ephemeralPublicKey: this._messages.paymentRequest.meta.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._messages.paymentRequest.meta.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.authority
      },
      body: {
        type: 'paymentRequest',
        orderId: this._orderId,
        promiseOfPayment: promiseOfPayment.readMeta(),
        paymentRequestForm: this._paymentRequestForm,
        timestamp: this._messages.paymentRequest.timestamp
      }
    }

    // implicitly verify packet by constructing new received packet
    return new PaymentRequest({type: 'receive', packet: paymentRequestPacket})
  }

  // check escrowContract
  _checkEscrowContract() {
    this._verifyTimestamp(this._messages.escrowContract.timestamp, this._messages.paymentRequest.timestamp)

    const paymentRequest = this._checkPaymentRequest()

    const escrowContractPacket = {
      header: {
        signature: this._messages.escrowContract.meta.signature,
        ephemeralPublicKey: this._messages.escrowContract.meta.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._messages.escrowContract.meta.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.authority
      },
      body: {
        type: 'escrowContract',
        orderId: this._orderId,
        paymentRequest: paymentRequest.readMeta(),
        timestamp: this._messages.escrowContract.timestamp
      }
    }

    // implicitly verify packet by constructing new received packet
    return new EscrowContract({type: 'receive', packet: escrowContractPacket})
  }

  // check pickupRequest - optional
  _checkPickupRequest() {
    this._verifyTimestamp(this._messages.pickupRequest.timestamp, this._messages.escrowContract.timestamp)

    const escrowContract = this._checkEscrowContract()

    const pickupRequestPacket = {
      header: {
        signature: this._messages.pickupRequest.meta.signature,
        ephemeralPublicKey: this._messages.pickupRequest.meta.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._messages.pickupRequest.meta.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.merchant
      },
      body: {
        type: 'pickupRequest',
        orderId: this._orderId,
        escrowContract: escrowContract.readMeta(),
        timestamp: this._messages.pickupRequest.timestamp
      }
    }

    // implicitly verify packet by constructing new received packet
    return new PickupRequest({type: 'receive', packet: pickupRequestPacket})
  }

  // check pickupReceipt - optional
  _checkPickupReceipt() {
    this._verifyTimestamp(this._messages.pickupReceipt.timestamp, this._messages.pickupRequest.timestamp)

    const pickupRequest = this._checkPickupRequest()

    const pickupReceiptPacket = {
      header: {
        signature: this._messages.pickupReceipt.meta.signature,
        ephemeralPublicKey: this._messages.pickupReceipt.meta.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._messages.pickupReceipt.meta.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.authority
      },
      body: {
        type: 'pickupReceipt',
        orderId: this._orderId,
        pickupRequest: pickupRequest.readMeta(),
        timestamp: this._messages.pickupReceipt.timestamp
      }
    }

    // implicitly verify packet by constructing new received packet
    return new PickupReceipt({type: 'receive', packet: pickupReceiptPacket})
  }

  // check proofOfDelivery
  _checkProofOfDelivery() {
    let proofOfDeliveryPacket
    const header = {
      signature: this._messages.proofOfDelivery.meta.signature,
      ephemeralPublicKey: this._messages.proofOfDelivery.meta.ephemeralPublicKey,
      ephemeralPublicKeyCertificate: this._messages.proofOfDelivery.meta.ephemeralPublicKeyCertificate,
      identityPublicKey: this._identities.consumer
    }
    const timestamp = this._messages.proofOfDelivery.timestamp

    if (this._messages.disputeReceipt) {
      this._verifyTimestamp(timestamp, this._messages.disputeReceipt.timestamp)

      const disputeReceipt = this._checkDisputeReceipt()

      proofOfDeliveryPacket = {
        header: header,
        body: {
          type: 'proofOfDelivery',
          orderId: this._orderId,
          disputeReceipt: disputeReceipt.readMeta(),
          timestamp: timestamp
        }
      }
    } else if (this._messages.pickupReceipt) {
      this._verifyTimestamp(timestamp, this._messages.pickupReceipt.timestamp)

      const pickupReceipt = this._checkPickupReceipt()

      proofOfDeliveryPacket = {
        header: header,
        body: {
          type: 'proofOfDelivery',
          orderId: this._orderId,
          pickupReceipt: pickupReceipt.readMeta(),
          timestamp: timestamp
        }
      }
    } else {
      this._verifyTimestamp(timestamp, this._messages.escrowContract.timestamp)

      const escrowContract = this._checkEscrowContract()

      proofOfDeliveryPacket = {
        header: header,
        body: {
          type: 'proofOfDelivery',
          orderId: this._orderId,
          escrowContract: escrowContract.readMeta(),
          timestamp: timestamp
        }
      }
    }

    // implicitly verify packet by constructing new received packet
    return new ProofOfDelivery({type: 'receive', packet: proofOfDeliveryPacket})
  }

  // exceptional transaction chain messages
  _checkMerchantDispute() {
    let merchantDisputePacket
    const header = {
      signature: this._messages.merchantDispute.meta.signature,
      ephemeralPublicKey: this._messages.merchantDispute.meta.ephemeralPublicKey,
      ephemeralPublicKeyCertificate: this._messages.merchantDispute.meta.ephemeralPublicKeyCertificate,
      identityPublicKey: this._identities.merchant
    }
    const timestamp = this._messages.merchantDispute.timestamp

    if (this._messages.pickupReceipt) {
      this._verifyTimestamp(timestamp, this._messages.pickupReceipt.timestamp)

      const pickupReceipt = this._checkPickupReceipt()

      merchantDisputePacket = {
        header: header,
        body: {
          type: 'merchantDispute',
          orderId: this._orderId,
          pickupReceipt: pickupReceipt.readMeta(),
          timestamp: timestamp
        }
      }
    } else {
      this._verifyTimestamp(timestamp, this._messages.escrowContract.timestamp)

      const escrowContract = this._checkEscrowContract()

      merchantDisputePacket = {
        header: header,
        body: {
          type: 'merchantDispute',
          orderId: this._orderId,
          escrowContract: escrowContract.readMeta(),
          timestamp: timestamp
        }
      }
    }

    // implicitly verify packet by constructing new received packet
    return new MerchantDispute({type: 'receive', packet: merchantDisputePacket})
  }

  // check escrowContract
  _checkDisputeReceipt() {
    this._verifyTimestamp(this._messages.disputeReceipt.timestamp, this._messages.merchantDispute.timestamp)

    const merchantDispute = this._checkMerchantDispute()

    const disputeReceiptPacket = {
      header: {
        signature: this._messages.disputeReceipt.meta.signature,
        ephemeralPublicKey: this._messages.disputeReceipt.meta.ephemeralPublicKey,
        ephemeralPublicKeyCertificate: this._messages.disputeReceipt.meta.ephemeralPublicKeyCertificate,
        identityPublicKey: this._identities.authority
      },
      body: {
        type: 'disputeReceipt',
        orderId: this._orderId,
        merchantDispute: merchantDispute.readMeta(),
        timestamp: this._messages.disputeReceipt.timestamp
      }
    }

    // implicitly verify packet by constructing new received packet
    return new DisputeReceipt({type: 'receive', packet: disputeReceiptPacket})
  }

  _checkMerchantCancellation() {
    let merchantCancellationPacket
    const header = {
      signature: this._messages.merchantCancellation.meta.signature,
      ephemeralPublicKey: this._messages.merchantCancellation.meta.ephemeralPublicKey,
      ephemeralPublicKeyCertificate: this._messages.merchantCancellation.meta.ephemeralPublicKeyCertificate,
      identityPublicKey: this._identities.merchant
    }
    const timestamp = this._messages.merchantCancellation.timestamp

    // check if there is a disputeReceipt
    if (this._messages.disputeReceipt) {
      this._verifyTimestamp(timestamp, this._messages.disputeReceipt.timestamp)

      const disputeReceipt = this._checkDisputeReceipt()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          disputeReceipt: disputeReceipt.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a MerchantDispute
    } else if (this._messages.merchantDispute) {
      this._verifyTimestamp(timestamp, this._messages.merchantDispute.timestamp)

      const merchantDispute = this._checkMerchantDispute()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          merchantDispute: merchantDispute.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a PickupReceipt
    } else if (this._messages.pickupReceipt) {
      this._verifyTimestamp(timestamp, this._messages.pickupReceipt.timestamp)

      const pickupReceipt = this._checkPickupReceipt()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          pickupReceipt: pickupReceipt.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a PickupRequest
    } else if (this._messages.pickupRequest) {
      this._verifyTimestamp(timestamp, this._messages.pickupRequest.timestamp)

      const pickupRequest = this._checkPickupRequest()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          pickupRequest: pickupRequest.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is an EscrowContract
    } else if (this._messages.escrowContract) {
      this._verifyTimestamp(timestamp, this._messages.escrowContract.timestamp)

      const escrowContract = this._checkEscrowContract()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          escrowContract: escrowContract.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a PaymentRequest
    } else if (this._messages.paymentRequest) {
      this._verifyTimestamp(timestamp, this._messages.paymentRequest.timestamp)

      const paymentRequest = this._checkPaymentRequest()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          paymentRequest: paymentRequest.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a PromiseOfPayment
    } else if (this._messages.promiseOfPayment) {
      this._verifyTimestamp(timestamp, this._messages.promiseOfPayment.timestamp)

      const promiseOfPayment = this._checkPromiseOfPayment()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          promiseOfPayment: promiseOfPayment.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is an invoiceReceipt
    } else if (this._messages.invoiceReceipt) {
      this._verifyTimestamp(timestamp, this._messages.invoiceReceipt.timestamp)

      const invoiceReceipt = this._checkInvoiceReceipt()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          invoiceReceipt: invoiceReceipt.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is an invoice
    } else {
      this._verifyTimestamp(timestamp, this._messages.invoice.timestamp)

      const invoice = this._checkInvoice()

      merchantCancellationPacket = {
        header: header,
        body: {
          type: 'merchantCancellation',
          orderId: this._orderId,
          invoice: invoice.readMeta(),
          timestamp: timestamp
        }
      }
    }

    // implicitly verify packet by constructing new received packet
    return new MerchantCancellation({type: 'receive', packet: merchantCancellationPacket})
  }

  _checkConsumerCancellation() {
    let consumerCancellationPacket
    const header = {
      signature: this._messages.consumerCancellation.meta.signature,
      ephemeralPublicKey: this._messages.consumerCancellation.meta.ephemeralPublicKey,
      ephemeralPublicKeyCertificate: this._messages.consumerCancellation.meta.ephemeralPublicKeyCertificate,
      identityPublicKey: this._identities.consumer
    }
    const timestamp = this._messages.consumerCancellation.timestamp

    if (this._messages.disputeReceipt) {
      this._verifyTimestamp(timestamp, this._messages.disputeReceipt.timestamp)

      const disputeReceipt = this._checkDisputeReceipt()

      consumerCancellationPacket = {
        header: header,
        body: {
          type: 'consumerCancellation',
          orderId: this._orderId,
          disputeReceipt: disputeReceipt.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a MerchantDispute
    } else if (this._messages.merchantDispute) {
      this._verifyTimestamp(timestamp, this._messages.merchantDispute.timestamp)

      const merchantDispute = this._checkMerchantDispute()

      consumerCancellationPacket = {
        header: header,
        body: {
          type: 'consumerCancellation',
          orderId: this._orderId,
          merchantDispute: merchantDispute.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a PickupReceipt
    } else if (this._messages.pickupReceipt) {
      this._verifyTimestamp(timestamp, this._messages.pickupReceipt.timestamp)

      const pickupReceipt = this._checkPickupReceipt()

      consumerCancellationPacket = {
        header: header,
        body: {
          type: 'consumerCancellation',
          orderId: this._orderId,
          pickupReceipt: pickupReceipt.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a PickupRequest
    } else if (this._messages.pickupRequest) {
      this._verifyTimestamp(timestamp, this._messages.pickupRequest.timestamp)

      const pickupRequest = this._checkPickupRequest()

      consumerCancellationPacket = {
        header: header,
        body: {
          type: 'consumerCancellation',
          orderId: this._orderId,
          pickupRequest: pickupRequest.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is an EscrowContract
    } else if (this._messages.escrowContract) {
      this._verifyTimestamp(timestamp, this._messages.escrowContract.timestamp)

      const escrowContract = this._checkEscrowContract()

      consumerCancellationPacket = {
        header: header,
        body: {
          type: 'consumerCancellation',
          orderId: this._orderId,
          escrowContract: escrowContract.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a PaymentRequest
    } else if (this._messages.paymentRequest) {
      this._verifyTimestamp(timestamp, this._messages.paymentRequest.timestamp)

      const paymentRequest = this._checkPaymentRequest()

      consumerCancellationPacket = {
        header: header,
        body: {
          type: 'consumerCancellation',
          orderId: this._orderId,
          paymentRequest: paymentRequest.readMeta(),
          timestamp: timestamp
        }
      }
      // if not check if there is a PromiseOfPayment
    } else {
      this._verifyTimestamp(timestamp, this._messages.promiseOfPayment.timestamp)

      const promiseOfPayment = this._checkPromiseOfPayment()

      consumerCancellationPacket = {
        header: header,
        body: {
          type: 'consumerCancellation',
          orderId: this._orderId,
          promiseOfPayment: promiseOfPayment.readMeta(),
          timestamp: timestamp
        }
      }
    }

    // implicitly verify packet by constructing new received packet
    return new ConsumerCancellation({type: 'receive', packet: consumerCancellationPacket})
  }

  setInvoice(invoice) {
    this._messages.invoice = invoice
    this._messages.invoice.body = this._generateInvoiceBody(invoice)
  }

  setInvoiceReceipt(invoiceReceipt) {
    this._messages.invoiceReceipt = invoiceReceipt
  }

  setPromiseOfPayment(promiseOfPayment) {
    this._messages.promiseOfPayment = promiseOfPayment
  }

  setPaymentRequest(paymentRequest) {
    this._messages.paymentRequest = paymentRequest
  }

  setEscrowContract(escrowContract) {
    this._messages.escrowContract = escrowContract
  }

  setPickupRequest(pickupRequest) {
    this._messages.pickupRequest = pickupRequest
  }

  setPickupReceipt(pickupReceipt) {
    this._messages.pickupReceipt = pickupReceipt
  }

  setProofOfDelivery(proofOfDelivery) {
    this._messages.proofOfDelivery = proofOfDelivery
  }

  setMerchantDispute(merchantDispute) {
    this._messages.merchantDispute = merchantDispute
  }

  setDisputeReceipt(disputeReceipt) {
    this._messages.disputeReceipt = disputeReceipt
  }

  setMerchantCancellation(merchantCancellation) {
    this._messages.merchantCancellation = merchantCancellation
  }

  setConsumerCancellation(consumerCancellatioon) {
    this._messages.consumerCancellation = consumerCancellation
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

  checkPickupRequest() {
    return this._checkPickupRequest()
  }

  checkPickupReceipt() {
    return this._checkPickupReceipt()
  }

  checkProofOfDelivery() {
    return this._checkProofOfDelivery()
  }

  checkMerchantDispute() {
    return this._checkMerchantDispute()
  }

  checkDisputeReceipt() {
    return this._disputeReceipt()
  }

  checkMerchantCancellation() {
    return this._checkMerchantCancellation()
  }

  _checkConsumerCancellation() {
    return this._checkConsumerCancellation()
  }
}

module.exports = TransactionChain
