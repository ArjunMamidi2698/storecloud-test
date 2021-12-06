
const express = require( 'express' ); // Importing express module
const app = express(); // new express app 
const cookieParser = require( "cookie-parser" );
const bodyParser = require( "body-parser" );
const cors = require( "cors" );
const server = require( "http" ).createServer( app );

const clientService = require( './client.service' );

require( 'dotenv' ).config( { path: '../.env' } ); // read properties from .env
const port = process.env.CLIENT_PORT || process.env.PORT || 3021;

app.use( express.json() );
app.use( express.urlencoded( { extended: false } ) );
app.use( cookieParser() );
app.use( cors() );
app.use( bodyParser.json() );
app.use( ( req, res, next ) => {
	res.header( 'Access-Control-Allow-Origin', '*' );
	next();
});

var io = require( 'socket.io-client' );
var socket = io.connect( `http://localhost:${process.env.SERVER_PORT}/`, {
	reconnection: true
});

var clientsLength = process.env.CLIENTS_COUNT;
var clients = []; // clients and their identities( public and private keys )
var intervals = []; // time intervals for adding transactions
var timeouts = []; // timeouts to clear the intervals
// CLIENT-SERVER Communication
socket.on( 'connect', function () {
	console.log( `connected to localhost:${process.env.SERVER_PORT}` );
	for (let index = 0; index < clientsLength; index++) {
		var data = clientService.generateUniqueClientId();
		console.log( 'creating user...', data );
		socket.emit( 'createUser', data );
	}
	socket.on( 'createdUser', function ( clientData ) {
		console.log( 'user created, starting polling to add transactions...', clientData.client_id );
		clients.push( clientData );
		if( clients.length == clientsLength ) {
			socket.emit( 'allUsersCreated' ); // to mineSystemTransaction for adding initial balance for clients
		}
		// start adding transactions polling
		intervals.push( setInterval( function () {
			var data = clientData;
			var currentIndex = clients.findIndex( ( obj ) => obj.client_id == data.client_id );
			var randomIndex = Math.floor( Math.random() * ( clients.length ) ); // random clients should not be current client
			while( randomIndex == currentIndex ) {
				randomIndex = Math.floor( Math.random() * ( clients.length ) );
			}
			console.log( "transaction between", data.client_id, clients[ randomIndex ].client_id );
			var transaction = clientService.generateSignedTransactionObject( data, clients[ randomIndex ].publicKey );
			socket.emit( 'addTransaction', transaction );
			if( timeouts[ currentIndex ] == undefined ) {
				timeouts.push( setTimeout(() => {
					clearInterval( intervals[ currentIndex ] );
					intervals[ currentIndex ] = null;
				}, 60000) ); // stop interval after 1 minute
			}
		}, process.env.MESSAGE_INTERVAL ) );
	});
});

// Server listening
server.listen( port, () => {
	console.log( `listening at ${port} port!!!!` );
});
