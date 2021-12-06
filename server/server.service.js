const EC = require( 'elliptic' ).ec;
const ec = new EC( 'secp256k1' );
const { BlockChain, Transaction } = require( "./blockchain" );

var ajCoin = null;

// helpers
function generateDigitalSignatureKeys() {
	var key = ec.genKeyPair();
	return {
		publicKey: key.getPublic( 'hex' ),
		privateKey: key.getPrivate( 'hex' )
	};
}
// if no blockchain instance existed, create a newinstance and update the ajcoin
function checkBlockChainInstance() {
	if( !ajCoin ) initiateBlockChain();
}
function initiateBlockChain() {
	ajCoin = new BlockChain();
}


const createClient = function( clientId ) {
	var identity = generateDigitalSignatureKeys();
	var clientData = {
		client_id: clientId,
		...identity
	};
	return clientData;
};

const addTransaction = function( data ) {
	checkBlockChainInstance();
	try{
		var tx = new Transaction( data.fromAddress, data.toAddress, data.amount, data.signature || null, data.txHash || null );
		ajCoin.addTransaction( tx );
		// if pendingTransactions has 100 transactions, then start mining process
		if( ajCoin.pendingTransactions.length == 100 ) {
			ajCoin.minePendingTransactions();
		}
		return tx;
	}
	catch( err ) {
		return { error: err.message };
	}
};

// system transactions for adding initial balance for the clients
const mineSystemTransactions = function() {
	checkBlockChainInstance();
	try{
		ajCoin.mineSystemTransactions();
	}
	catch( err ) {
		return { error: err.message };
	}
};

const getChain = function() {
	checkBlockChainInstance();
	try{
		return ajCoin.chain;
	}
	catch( err ){
		return { error: err.message };
	}
};

// finished/mined blocks count
const getBlocksCount = function() {
	checkBlockChainInstance();
	try{
		return ajCoin.chain.length;
	}
	catch( err ){
		return { error: err.message };
	}
};

// latest block
const getLatestBlock = function() {
	checkBlockChainInstance();
	try{
		return ajCoin.getLastBlock();
	}
	catch( err ){
		return { error: err.message };
	}
};

const getBlock = function( index ) {
	checkBlockChainInstance();
	try{
		if( index >= 0 && index < ajCoin.chain.length ) return ajCoin.chain[ index ];
		else throw new Error( "Block at index:" + index + " is not created yet!" );
	}
	catch( err ){
		return { error: err.message };
	}
};

const getBlockFromHash = function( hash ) {
	checkBlockChainInstance();
	try{
		return ajCoin.getBlockFromHash( hash );
	}
	catch( err ) {
		console.log( err.message );
		return { error: err.message };
	}
};

const getPreviousBlockFromHash = function( hash ) {
	checkBlockChainInstance();
	try{
		return ajCoin.getPreviousBlockFromHash( hash );
	}
	catch( err ) {
		return { error: err.message };
	}
};

const getBalanceOfAddress = function( walletAddress ) {
	checkBlockChainInstance();
	try{
		return ajCoin.getBalanceOfAddress( walletAddress );
	}
	catch( err ){
		return { error: err.message };
	}
};

const getAllTransactionsForWallet = function( walletAddress ) {
	checkBlockChainInstance();
	try{
		return ajCoin.getAllTransactionsForWallet( walletAddress );
	}
	catch( err ){
		return { error: err.message };
	}
};

const getPendingTransactions = function() {
	checkBlockChainInstance();
	try{
		return ajCoin.pendingTransactions;
	}
	catch( err ) {
		return { error: err.message };
	}
};

module.exports = {
	createClient,
	addTransaction, mineSystemTransactions,
	getChain, getBlocksCount,
	getLatestBlock, getBlock, getBlockFromHash, getPreviousBlockFromHash,
	getBalanceOfAddress, getAllTransactionsForWallet, getPendingTransactions
};
