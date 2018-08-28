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
    "invoice"
  ],
  "properties": {
    "type": {
      "$id": "#/properties/type",
      "type": "string",
      "title": "The Type Schema",
      "examples": [
        "invoiceReceipt"
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
    "invoice": {
      "$id": "#/properties/invoice",
      "type": "object",
      "title": "The Invoice Schema",
      "additionalProperties": false,
      "required": [
        "signature",
        "ephemeralPublicKey",
        "ephemeralPublicKeyCertificate",
        "identityPublicKey"
      ],
      "properties": {
        "signature": {
          "$id": "#/properties/invoice/properties/signature",
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
          "$id": "#/properties/invoice/properties/ephemeralPublicKey",
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
          "$id": "#/properties/invoice/properties/ephemeralPublicKeyCertificate",
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
          "$id": "#/properties/invoice/properties/identityPublicKey",
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
    }
  }
}
