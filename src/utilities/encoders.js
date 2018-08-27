var util = require('tweetnacl-util');

exports.b64ToByteArray = function(b64) {
	return util.decodeBase64(b64)
}

exports.byteArrayToB64 = function(bytes) {
	return util.encodeBase64(bytes)
}

exports.stringToByteArray = function(string) {
	return util.decodeUTF8(string)
}

exports.byteArrayToString = function(bytes) {
	return util.encodeUTF8(bytes)
}
