const assert = require( 'assert' );
const { Transaction } = require( '../server/blockchain' );
const clientService = require( "../client/client.service" );
const { createSignedTransactions, signingKey } = require( './helpers' );

let transactionObject = null;

beforeEach( function() {
  transactionObject = new Transaction( 'fromAddress', 'toAddress', 9999 );
});

describe( 'Transaction class', function() {
	describe( 'Constructor', function() {
		it( 'should create instance with correct parameters fromAddress, toAddress, amount', function() {
			transactionObject = new Transaction( 'wallet1', 'wallet2', 10 );

			assert.strict.equal( transactionObject.fromAddress, 'wallet1' );
			assert.strict.equal( transactionObject.toAddress, 'wallet2' );
			assert.strict.equal( transactionObject.amount, 10 );
		});
	});

	describe( 'Calculate hash', function() {
		it( 'should calculate the SHA256 string and give correct value', function() {
			transactionObject = new Transaction( 'wallet1', 'wallet2', 10 );
			assert.strict.equal(
			transactionObject.calculateHash(),
			'd8f365fbb2e7b247efb120790701f1ec882b3f02dd0ba03ff0d73bb76706071b' // Output of SHA256( "wallet1wallet210" )
			);
		});

		it( 'should change if transaction is tampered', function() {
			transactionObject = new Transaction( 'wallet1', 'wallet2', 10 );

			const originalHash = transactionObject.calculateHash();
			transactionObject.amount = 100;

			assert.strict.notEqual(
			transactionObject.calculateHash(),
			originalHash
			);
		});
	});

	describe( 'isTransactionValid', function() {
		it( 'should throw error if transaction does not have a signature', function() {
			assert.throws( () => { transactionObject.isTransactionValid(); }, Error );
		});

		it( 'should sign transactions correctly', function() {
			transactionObject = createSignedTransactions();

			assert.strict.equal(
			transactionObject.signature,
			'3045022100eabec48de73897c1d4ea262ebfa92763ebf274557ae0b0d2e6980909f5a99cce022056e688efc9ab03f03e07f563e486c36ae0c35025fc7f3fb8a23de16bd60cb909'
			);
		});

		it( 'should fail signing transactions for other wallets', function() {
			var clientData = { 
			publicKey: "not-a-correct-wallet-key",
			privateKey: signingKey.getPrivate( 'hex' ),
			amount: 10
			};
			assert.throws(() => {
			clientService.generateSignedTransactionObject( clientData, "wallet2" );
			}, Error);
		});

		it( 'should fail signed transactions is invalid or tampered', function() {
			transactionObject = createSignedTransactions();

			// Tamper with it & it should be invalid!
			transactionObject.amount = 100;
			assert( !transactionObject.isTransactionValid() );
		});

		it( 'should return true if transactions are signed correctly', function() {
			transactionObject = createSignedTransactions();
			assert( transactionObject.isTransactionValid() );
		});

		it( 'should fail if signature is empty string', function() {
			transactionObject.signature = '';
			assert.throws( () => { transactionObject.isTransactionValid(); }, Error );
		});

		it( 'should return true for mining rewards case', function() {
			transactionObject.fromAddress = "system";
			assert( transactionObject.isTransactionValid() );
		});
	});
});
