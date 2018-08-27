const Dinero = require('dinero.js')

module.exports = function(manifest, feeProfile) {

  var computations = {
    manifestTotalPreTax: null,
    manifestTotalPostTax: null,
    feeTotalPreTax: null,
    feeTotalPostTax: null,
    feeMerchantPreTax: null,
    feeMerchantPostTax: null,
    feeConsumerPreTax: null,
    feeConsumerPostTax: null,
    totalMerchantPaymentPreTax: null,
    totalMerchantPaymentPostTax: null,
    totalConsumerPaymentPreTax: null,
    totalConsumerPaymentPostTax: null
  }

  const manifestSubTotalsPreTax = manifest.map(item => {
    return {
      subTotalPreTax: Dinero({ amount: parseInt(item.price * 10000000000), precision: 10 }).multiply(item.quantity, 'HALF_AWAY_FROM_ZERO'),
      tax: item.tax
    }
  })

  const manifestSubTotalsPostTax = manifestSubTotalsPreTax.map(item => {
    return {
      subTotalPostTax: item.subTotalPreTax.add(item.subTotalPreTax.percentage(item.tax))
    }
  })

  const manifestTotalPreTax = manifestSubTotalsPreTax.reduce((result, item) => {
    return result.add(item.subTotalPreTax)
  }, Dinero({ amount: 0 }))

  const manifestTotalPostTax = manifestSubTotalsPostTax.reduce((result, item) => {
    return result.add(item.subTotalPostTax)
  }, Dinero({ amount: 0 }))

  const feeTotalPreTax = Dinero({ amount: feeProfile.baseFee * 10000000000, precision: 10 }).add(manifestTotalPreTax.percentage(feeProfile.variableFee))
  const feeTotalPostTax = feeTotalPreTax.add(feeTotalPreTax.percentage(feeProfile.tax))

  const feeBurdensPreTax = feeTotalPreTax.allocate([feeProfile.merchantBurden, 100 - feeProfile.merchantBurden])
  const feeMerchantPreTax = feeBurdensPreTax[0]
  const feeConsumerPreTax = feeBurdensPreTax[1]

  const feeBurdensPostTax = feeTotalPostTax.allocate([feeProfile.merchantBurden, 100 - feeProfile.merchantBurden])
  const feeMerchantPostTax = feeBurdensPostTax[0]
  const feeConsumerPostTax = feeBurdensPostTax[1]

  const totalMerchantPaymentPreTax = feeMerchantPreTax
  const totalMerchantPaymentPostTax = feeMerchantPostTax

  const totalConsumerPaymentPreTax = manifestTotalPreTax.add(feeConsumerPreTax)
  const totalConsumerPaymentPostTax = manifestTotalPostTax.add(feeConsumerPostTax)

  computations.manifestTotalPreTax = manifestTotalPreTax.toRoundedUnit(2)
  computations.manifestTotalPostTax = manifestTotalPostTax.toRoundedUnit(2)
  computations.feeTotalPreTax = feeTotalPreTax.toRoundedUnit(2)
  computations.feeTotalPostTax = feeTotalPostTax.toRoundedUnit(2)
  computations.feeMerchantPreTax = feeMerchantPreTax.toRoundedUnit(2)
  computations.feeConsumerPreTax = feeConsumerPreTax.toRoundedUnit(2)
  computations.feeMerchantPostTax = feeMerchantPostTax.toRoundedUnit(2)
  computations.feeConsumerPostTax = feeConsumerPostTax.toRoundedUnit(2)
  computations.totalConsumerPaymentPreTax = totalConsumerPaymentPreTax.toRoundedUnit(2)
  computations.totalConsumerPaymentPostTax = totalConsumerPaymentPostTax.toRoundedUnit(2)
  computations.totalMerchantPaymentPreTax = totalMerchantPaymentPreTax.toRoundedUnit(2)
  computations.totalMerchantPaymentPostTax = totalMerchantPaymentPostTax.toRoundedUnit(2)

  return computations
}
