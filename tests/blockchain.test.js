const assert = require( 'assert' );
const { BlockChain } = require( '../server/blockchain' );
const { createSignedTransactions, signingKey, createBlockchainWithValidTransactions, createBlockChain } = require( './helpers' );

let blockchain = null;

beforeEach( function() {
  blockchain = new BlockChain();
});

describe( 'BlockChain class', function() {
	describe( 'Constructor', function() {
		it( 'should create instance with correct parameters', function() {
			assert.strict.equal( blockchain.severity, 2 );
			assert.strict.deepEqual( blockchain.pendingTransactions, [] );
			assert.strict.equal( blockchain.miningReward, 100 );
		});
	});

	describe( 'addTransaction', function() {
		it( 'should add new transaction correctly if it is valid', function() {
			const blockchain = createBlockChain();
			const newTransaction = createSignedTransactions();
			blockchain.addTransaction( newTransaction );

			assert.strict.deepEqual( blockchain.pendingTransactions[ 0 ], newTransaction );
		});

		it( 'should fail if transaction has no fromAddress', function() {
			const newTransaction = createSignedTransactions();
			newTransaction.fromAddress = null;

			assert.throws( () => { blockchain.addTransaction( newTransaction ); }, Error );
		});

		it( 'should fail if transaction has no toAddress', function() {
			const newTransaction = createSignedTransactions();
			newTransaction.toAddress = null;

			assert.throws( () => { blockchain.addTransaction( newTransaction ); }, Error );
		});

		it( 'should fail if transaction is invalid or tampered', function() {
			const newTransaction = createSignedTransactions();
			newTransaction.amount = 1000;

			assert.throws( () => { blockchain.addTransaction( newTransaction ); }, Error );
		});
			
		it( 'should fail if transaction has negative or zero amount', function() {
			const tx1 = createSignedTransactions( 0 );
			assert.throws( () => { blockchain.addTransaction( tx1); }, Error );

			const tx2 = createSignedTransactions( -20 );
			assert.throws( () => { blockchain.addTransaction( tx2 ); }, Error );
		});

		it( 'should fail if wallet does not have enough balance to transfer', function() {
			const tx = createSignedTransactions();
			assert.throws( () => { blockchain.addTransaction( tx ); }, Error );
		});
	});

	describe( 'Balance of a walletAddress', function() {
		it( 'should give mining rewards for the given walletAddress for successful mining of a block', function() {
			const blockchain = createBlockChain();
			const newTransaction = createSignedTransactions();
			blockchain.addTransaction( newTransaction );
			blockchain.addTransaction( newTransaction );

			blockchain.minePendingTransactions( 'walletAddress2' );

			assert.strict.equal( blockchain.getBalanceOfAddress( 'walletAddress2' ), 100 );
		});

		it( 'should correctly reduce wallet balance', function() {
			const walletAddress = signingKey.getPublic( 'hex' );
			const blockchain = createBlockchainWithValidTransactions();

			blockchain.minePendingTransactions( walletAddress );
			assert.strict.equal( blockchain.getBalanceOfAddress( walletAddress ), 180 );
		});
	});

	describe( 'helper functions', function() {
		it( 'should correctly set first block as Genesis block', function() {
			assert.strict.deepEqual( blockchain.chain[ 0 ], blockchain.initiateGenisisBlock() );
		});
	});

	describe( 'isChainValid', function() {
		it( 'should return true if no tampering with blocks hash or transactions', function() {
			const blockchain = createBlockchainWithValidTransactions();
			assert( blockchain.isChainValid() );
		});

		it( 'should fail if genesis block tampered', function() {
			blockchain.chain[ 0 ].timestamp = 39708;
			assert( !blockchain.isChainValid() );
		});

		it( 'should fail if a transaction is invalid', function() {
			const blockchain = createBlockchainWithValidTransactions();
			blockchain.chain[ 2 ].transactions[ 1 ].amount = 23456;
			assert( !blockchain.isChainValid() );
		});

		it( 'should fail if a block is tampered', function() {
			const blockchain = createBlockchainWithValidTransactions();
			blockchain.chain[ 1 ].timestamp = 654321;
			assert( !blockchain.isChainValid() );
		});

		it( 'should fail if a previous block hash is changed', function() {
			const blockchain = createBlockchainWithValidTransactions();
			blockchain.chain[ 1 ].transactions[ 0 ].amount = 897397;
			blockchain.chain[ 1 ].hash = blockchain.chain[ 1 ].calculateHash();
			assert( !blockchain.isChainValid() );
		});
	});

	describe( 'All Transactions for wallet', function() {
		it( 'should retrieve all Transactions for given Wallet address', function() {
			const blockchain = createBlockChain();
			const newTransaction = createSignedTransactions();
			blockchain.addTransaction( newTransaction );
			blockchain.addTransaction( newTransaction );

			blockchain.minePendingTransactions( 'wallet2' );
			blockchain.addTransaction( newTransaction );
			blockchain.addTransaction( newTransaction );
			blockchain.minePendingTransactions( 'wallet2' );

			assert.strict.equal( blockchain.getAllTransactionsForWallet( 'wallet2' ).length, 2 );
			assert.strict.equal( blockchain.getAllTransactionsForWallet( signingKey.getPublic( 'hex' ) ).length, 5 );
			for ( const tx of blockchain.getAllTransactionsForWallet( 'wallet2' ) ) {
			assert.strict.equal( tx.amount, 100 );
			assert.strict.equal( tx.fromAddress, "system" );
			assert.strict.equal( tx.toAddress, 'wallet2' );
			}
		});
	});
});
