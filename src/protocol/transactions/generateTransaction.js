const calculateInvoice = require('../accounting').calculateInvoice
const generateOrderId = require('../../utilities').generateOrderId

module.exports = function(manifest, feeProfile, delivery = false) {
  const orderId = generateOrderId()
  const calculatedFields = calculateInvoice(manifest, feeProfile)

  const invoice = {
    type: 'invoice',
    delivery: delivery,
    orderId: orderId,
    manifest: manifest,
    manifestTotalPreTax: calculatedFields.manifestTotalPreTax,
    manifestTotalPostTax: calculatedFields.manifestTotalPostTax,
    feeProfile: feeProfile,
    feeTotalPreTax: calculatedFields.feeTotalPreTax,
    feeTotalPostTax: calculatedFields.feeTotalPostTax,
    feeMerchantPreTax: calculatedFields.feeMerchantPreTax,
    feeMerchantPostTax: calculatedFields.feeMerchantPostTax,
    feeConsumerPreTax: calculatedFields.feeConsumerPreTax,
    feeConsumerPostTax: calculatedFields.feeConsumerPostTax,
    totalMerchantPaymentPreTax: calculatedFields.totalMerchantPaymentPreTax,
    totalMerchantPaymentPostTax: calculatedFields.totalMerchantPaymentPostTax,
    totalConsumerPaymentPreTax: calculatedFields.totalConsumerPaymentPreTax,
    totalConsumerPaymentPostTax: calculatedFields.totalConsumerPaymentPostTax
  }

  return {
    orderId: orderId,
    invoice: invoice
  }
}
