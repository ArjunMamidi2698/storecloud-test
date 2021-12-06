const express = require( "express" ); // Importing express module
const app = express(); // new express app 
const cookieParser = require( "cookie-parser" );
const bodyParser = require( "body-parser" );
const cors = require( "cors" );
const server = require( "http" ).createServer( app );
const io = require( "socket.io" )( server );
require( "dotenv" ).config( { path: '../.env' } );

const blockChainService = require( './server.service' );

const port = process.env.SERVER_PORT || process.env.PORT || 2021;

app.use( express.json() );
app.use( express.urlencoded( { extended: false } ) );
app.use( cookieParser() );
app.use( cors() );
app.use( bodyParser.json() );
app.use( ( req, res, next ) => {
	res.header( 'Access-Control-Allow-Origin', '*' );
	next();
});




function handleJSONResponse( res, data ) {
	res.setHeader( 'Content-Type', 'application/json' );
	app.set('json spaces', 4);
    res.json( data );
}
// routes for the app
// get chain
app.get( '/getChain', ( req, res ) => {
	console.log( "Retrieving chain: " );
	var chain = blockChainService.getChain();
	handleJSONResponse( res, chain );
});
// get blocks count
app.get( '/getFinishedBlocksCount', ( req, res ) => {
	var count = blockChainService.getBlocksCount();
	console.log( "Retrieved finished blocks count", count );
	handleJSONResponse( res, { count: count } );
});

// get latest block
app.get( '/getLatestBlock', ( req, res ) => {
	console.log( "Retrieving latest Block: " );
	var lastestBlock = blockChainService.getLatestBlock();
	handleJSONResponse( res, lastestBlock );
});
// get blocks at index
app.get( '/getBlock/:index', ( req, res ) => {
	var index = req.params.index;
	console.log( "Retrieving Block at index: ", index );
	var block = blockChainService.getBlock( index );
	handleJSONResponse( res, block );
});
// get block from hash
app.get( '/getBlock', ( req, res ) => {
	console.log( "Retrieving current Block from hash: " );
	var hash = req.query[ 'hash' ];
	var block = blockChainService.getBlockFromHash( hash );
	handleJSONResponse( res, block );
});
// get previous block from hash
app.get( '/getPreviousBlock', ( req, res ) => {
	console.log( "Retrieving previous Block from hash: " );
	var hash = req.query[ 'hash' ];
	var block = blockChainService.getPreviousBlockFromHash( hash );
	handleJSONResponse( res, block );
});

// get balance of address
app.get( '/getBalance/:address', ( req, res ) => {
	var address = req.params.address;
	console.log( "Balance for address: ", address );
	var balance = blockChainService.getBalanceOfAddress( address );
	handleJSONResponse( res, { walletAddress: address, balance: balance } );
});
// get transactions of address
app.get( '/getAllTransactions/:address', ( req, res ) => {
	var address = req.params.address;
	console.log( "Transactions for address: ", address );
	var transactions = blockChainService.getAllTransactionsForWallet( address );
	handleJSONResponse( res, { walletAddress: address, transactions: transactions } );
});
// get pending transactions to be mined
app.get( '/getPendingTransactions', ( req, res ) => {
	console.log( "Retrieving Pending Transactions" );
	var transactions = blockChainService.getPendingTransactions();
	handleJSONResponse( res, transactions );
});



// CLIENT-SERVER communication
io.on( 'connection', function ( socket ) {
	console.log( 'connected:', socket.client.id );
	socket.on( 'createUser', function ( clientId ) {
		console.log( 'creating user........', clientId );
		var userData = blockChainService.createClient( clientId );
		socket.emit( 'createdUser', userData );
		blockChainService.addTransaction( { fromAddress: 'system', toAddress: userData.publicKey, amount: 100 } ); // initial transactions for balance
	});
	socket.on( 'allUsersCreated', function () {
		blockChainService.mineSystemTransactions(); // initial balance
	});
	socket.on( 'addTransaction', function ( data ) {
		blockChainService.addTransaction( data );
	});
});

// Server listening
server.listen( port, () => {
	console.log( `listening at ${port} port!!!!` );
});
