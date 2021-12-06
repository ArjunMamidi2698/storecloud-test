const { Transaction, BlockChain } = require( "../server/blockchain" );
const clientService = require( "../client/client.service" );
const EC = require( 'elliptic' ).ec;
const ec = new EC( 'secp256k1' );
const signingKey = ec.keyFromPrivate( '6c80e0c32808f94c06d67361d619703fd1c7a80b7801fde1cc8fd5951af011c3' );

// creates and retrieves a new signed transaction object
function createSignedTransactions( amount = 10 ) {
	var clientData = { 
		publicKey: signingKey.getPublic( 'hex' ),
		privateKey: signingKey.getPrivate( 'hex' ),
		amount
	};
	var txObject = clientService.generateSignedTransactionObject( clientData, "wallet-2" );
	var newTransaction = new Transaction( txObject.fromAddress, txObject.toAddress, txObject.amount, txObject.signature, txObject.txHash );
	return newTransaction;
}

// create a new blockchain instance and add a new block
function createBlockChain() {
	const blockchain = new BlockChain();
	blockchain.minePendingTransactions( signingKey.getPublic( 'hex' ) );

	return blockchain;
}

function createBlockchainWithValidTransactions() {
	const blockchain = new BlockChain();
	blockchain.minePendingTransactions( signingKey.getPublic( 'hex' ) );

	var clientData = { 
		publicKey: signingKey.getPublic( 'hex' ),
		privateKey: signingKey.getPrivate( 'hex' ),
		amount: 10
	};
	var txObject = clientService.generateSignedTransactionObject( clientData, "wallet2" );
	var validTransaction = new Transaction( txObject.fromAddress, txObject.toAddress, txObject.amount, txObject.signature, txObject.txHash );
	blockchain.addTransaction( validTransaction );
	var txObject2 = clientService.generateSignedTransactionObject( clientData, "wallet3" );
	var validTransaction2 = new Transaction( txObject2.fromAddress, txObject2.toAddress, txObject2.amount, txObject2.signature, txObject2.txHash );
	blockchain.addTransaction( validTransaction2 );
	blockchain.minePendingTransactions( 1 );
	return blockchain;
}

module.exports.signingKey = signingKey;
module.exports.createSignedTransactions = createSignedTransactions;
module.exports.createBlockchainWithValidTransactions = createBlockchainWithValidTransactions;
module.exports.createBlockChain = createBlockChain;
