const { v4 } = require( 'uuid' );
const SHA256 = require( 'crypto-js/sha256' );
const EC = require( 'elliptic' ).ec;
const ec = new EC( 'secp256k1' );

var clientIdsList = []; // unique client Id's
// generates a unique id for client using uuid
const generateUniqueClientId = function() {
	let clientId = v4();
	while( clientIdsList.includes( clientId ) ) {
		clientId = v4();
	}
    clientIdsList.push( clientId );
	return clientId;
};

// generates elliptic key-pair object from private key
function getKeyFromPrivate( privateKey ) {
	return ec.keyFromPrivate( privateKey, 'hex' );
}

// returns a hash using SHA256 and converts to string
function calculateHash( data ) {
	return SHA256( data ).toString();
}

// returns a signature for the transaction hash
function signTransaction( signingKey, walletAddress, txHash ) {
	// key validation
	if( signingKey.getPublic( 'hex' ) !== walletAddress ) {
		throw new Error( "cannot sign transactions for other wallets" );
	}
	const signature = signingKey.sign( txHash, 'base64' );
	return signature.toDER( 'hex' );
}

// returns a transaction object
const generateSignedTransactionObject = function( clientData, toAddress ) {
	var transaction = {
		fromAddress: clientData.publicKey, // client wallet address
		toAddress: toAddress, // random client wallet address
		amount: clientData.amount || Math.random(),
	};
	// creates a hash with fromAddress, toAddress, amount
	transaction[ 'txHash' ] = calculateHash( transaction.fromAddress + transaction.toAddress + transaction.amount );
	// sign the transaction with the hash and add into the transaction object
	transaction[ 'signature' ] = signTransaction( getKeyFromPrivate( clientData.privateKey ), transaction.fromAddress, transaction.txHash );
	return transaction;
};

module.exports = {
    generateUniqueClientId, generateSignedTransactionObject
};
