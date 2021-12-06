const EC = require( 'elliptic' ).ec;
const ec = new EC( 'secp256k1' );

var key = ec.genKeyPair(); // key-pair for node-server
var publicKey = key.getPublic( 'hex' );
var privateKey = key.getPrivate( 'hex' );

// console.log( "publickey: ", publicKey );
// console.log( "privatekey: ", privateKey );

module.exports.ec = ec;
module.exports.signingKey = key;