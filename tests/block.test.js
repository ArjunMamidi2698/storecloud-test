const assert = require( 'assert' );
const { Block } = require( '../server/blockchain' );
const { createSignedTransactions } = require( './helpers' );

let blockObject = null;

beforeEach(function() {
	blockObject = new Block( 1000, [createSignedTransactions()], 'a1' );
});

describe( 'Block class', function() {
	describe( 'Constructor', function() {
		it( 'should create instance with correct parameters', function() {
			assert.strict.equal( blockObject.previousHash, 'a1' );
			assert.strict.equal( blockObject.timestamp, 1000 );
			assert.strict.deepEqual( blockObject.transactions, [ createSignedTransactions() ] );
			assert.strict.equal( blockObject.mineHelper, 0 );
		});

		it('should create instance with correct parameters, without giving "previousHash"', function() {
			blockObject = new Block( 1000, [ createSignedTransactions() ] );
			assert.strict.equal( blockObject.previousHash, '' );
			assert.strict.equal( blockObject.timestamp, 1000 );
			assert.strict.deepEqual( blockObject.transactions, [ createSignedTransactions() ] );
			assert.strict.equal( blockObject.mineHelper, 0 );
		});
	});

	describe( 'Calculate hash for the block', function() {
		it( 'should calculate the SHA256 string and give correct value', function() {
			blockObject.timestamp = 1;
			blockObject.mineBlock( 1 );

			assert.strict.equal(
			blockObject.hash,
			'0783c47d56971cccd6b98b75c60cc50ed39f74fcfda6906d47769255458aca89'
			);
		});

		it( 'should change when transaction is tampered', function() {
			const originalHash = blockObject.calculateHash();
			blockObject.timestamp = 100;

			assert.strict.notEqual(
			blockObject.calculateHash(),
			originalHash
			);
		});
	});

	describe( 'Valid Transactions?', function() {
		it( 'should return true if all transactions are valid', function() {
			blockObject.transactions = [
			createSignedTransactions(),
			createSignedTransactions(),
			createSignedTransactions()
			];
			assert( blockObject.hasValidTransactions() );
		});

		it( 'should return false is any single transactions is tampered or invalid', function() {
			const invalidTx = createSignedTransactions();
			invalidTx.amount = 1337;
			blockObject.transactions = [
			createSignedTransactions(),
			invalidTx
			];
			assert( !blockObject.hasValidTransactions() );
		});
	});
});
