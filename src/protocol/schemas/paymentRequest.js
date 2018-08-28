module.exports = {
  "definitions": {},
  "$schema": "",
  "$id": "http://example.com/root.json",
  "type": "object",
  "title": "The Root Schema",
  "additionalProperties": false,
  "required": [
    "type",
    "orderId",
    "promiseOfPayment",
    "paymentRequestForm"
  ],
  "properties": {
    "type": {
      "$id": "#/properties/type",
      "type": "string",
      "title": "The Type Schema",
      "examples": [
        "paymentRequest"
      ],
      "maxLength": 255,
      "pattern": "^(.*)$"
    },
    "orderId": {
      "$id": "#/properties/orderId",
      "type": "string",
      "title": "The Orderid Schema",
      "examples": [
        "jo8L+5hk1SAxvZfK9G4DjI1jurT/mlCIIZkJS5f+/X8="
      ],
      "minLength": 44,
      "maxLength": 44,
      "pattern": "^(.*)$"
    },
    "promiseOfPayment": {
      "$id": "#/properties/promiseOfPayment",
      "type": "object",
      "title": "The Promiseofpayment Schema",
      "additionalProperties": false,
      "required": [
        "signature",
        "ephemeralPublicKey",
        "ephemeralPublicKeyCertificate",
        "identityPublicKey"
      ],
      "properties": {
        "signature": {
          "$id": "#/properties/promiseOfPayment/properties/signature",
          "type": "string",
          "title": "The Signature Schema",
          "examples": [
            "jo8L+5hk1SAxvZfK9G4DjI1jurT/mlCIIZkJS5f+/X8=jo8L+5hk1SAxvZfK9G4DjI1jurT/mlCIIZkJS5f+/X8="
          ],
          "minLength": 88,
          "maxLength": 88,
          "pattern": "^(.*)$"
        },
        "ephemeralPublicKey": {
          "$id": "#/properties/promiseOfPayment/properties/ephemeralPublicKey",
          "type": "string",
          "title": "The Ephemeralpublickey Schema",
          "examples": [
            "jo8L+5hk1SAxvZfK9G4DjI1jurT/mlCIIZkJS5f+/X8="
          ],
          "minLength": 44,
          "maxLength": 44,
          "pattern": "^(.*)$"
        },
        "ephemeralPublicKeyCertificate": {
          "$id": "#/properties/promiseOfPayment/properties/ephemeralPublicKeyCertificate",
          "type": "string",
          "title": "The Ephemeralpublickeycertificate Schema",
          "examples": [
            "jo8L+5hk1SAxvZfK9G4DjI1jurT/mlCIIZkJS5f+/X8=jo8L+5hk1SAxvZfK9G4DjI1jurT/mlCIIZkJS5f+/X8="
          ],
          "minLength": 88,
          "maxLength": 88,
          "pattern": "^(.*)$"
        },
        "identityPublicKey": {
          "$id": "#/properties/promiseOfPayment/properties/identityPublicKey",
          "type": "string",
          "title": "The Identitypublickey Schema",
          "examples": [
            "jo8L+5hk1SAxvZfK9G4DjI1jurT/mlCIIZkJS5f+/X8="
          ],
          "minLength": 44,
          "maxLength": 44,
          "pattern": "^(.*)$"
        }
      }
    },
    "paymentRequestForm": {
      "$id": "#/properties/paymentRequestForm",
      "type": "object",
      "title": "The Paymentrequestform Schema",
      "additionalProperties": false,
      "required": [
        "Version",
        "SignatureMethod",
        "MerRespURL",
        "MerID",
        "AcqID",
        "PurchaseCurrency",
        "PurchaseCurrencyExponent",
        "OrderID",
        "PurchaseAmt",
        "Signature"
      ],
      "properties": {
        "Version": {
          "$id": "#/properties/paymentForm/properties/Version",
          "type": "string",
          "title": "The Version Schema",
          "examples": [
            "1.0.0"
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "SignatureMethod": {
          "$id": "#/properties/paymentForm/properties/SignatureMethod",
          "type": "string",
          "title": "The Signaturemethod Schema",
          "examples": [
            "SHA1"
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "MerRespURL": {
          "$id": "#/properties/paymentForm/properties/MerRespURL",
          "type": "string",
          "title": "The Merrespurl Schema",
          "examples": [
            "https://api.consentful.io/gateway/response"
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "MerID": {
          "$id": "#/properties/paymentForm/properties/MerID",
          "type": "string",
          "title": "The Merid Schema",
          "examples": [
            "1412312341234"
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "AcqID": {
          "$id": "#/properties/paymentForm/properties/AcqID",
          "type": "string",
          "title": "The Acqid Schema",
          "examples": [
            "1234123412344"
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "PurchaseCurrency": {
          "$id": "#/properties/paymentForm/properties/PurchaseCurrency",
          "type": "string",
          "title": "The Purchasecurrency Schema",
          "examples": [
            "462"
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "PurchaseCurrencyExponent": {
          "$id": "#/properties/paymentForm/properties/PurchaseCurrencyExponent",
          "type": "string",
          "title": "The Purchasecurrencyexponent Schema",
          "examples": [
            "2"
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "OrderID": {
          "$id": "#/properties/paymentForm/properties/OrderID",
          "type": "string",
          "title": "The Orderid Schema",
          "examples": [
            "jo8L+5hk1SAxvZfK9G4DjI1jurT/mlCIIZkJS5f+/X8="
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "PurchaseAmt": {
          "$id": "#/properties/paymentForm/properties/PurchaseAmt",
          "type": "string",
          "title": "The Purchaseamt Schema",
          "examples": [
            "000000002500"
          ],
          "maxLength": 255,
          "pattern": "^(.*)$"
        },
        "Signature": {
          "$id": "#/properties/paymentForm/properties/Signature",
          "type": "string",
          "title": "The Signature Schema",
          "examples": [
            "kkKdgqQekwSGxt5evalgLVXDmYY="
          ],
          "minLength": 28,
          "maxLength": 28,
          "pattern": "^(.*)$"
        }
      }
    }
  }
}
