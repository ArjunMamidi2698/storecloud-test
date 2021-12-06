const SHA256 = require( 'crypto-js/sha256' );
const { ec, signingKey } = require( "../keygenerator" );
const { MerkleTree } = require( 'merkletreejs' );

class Transaction {

	/**
	 * A transaction between fromAddress and toAddress of desired amount.
	 * A hash( txHash ) is created for these params using SHA256 and 
	 * signed at client side using elliptic key-pair object and 
	 * stored inside the transaction object and verifies the signature here and 
	 * later stored into the blockchain inside a block.
	 *
	 * @param {string} fromAddress
	 * @param {string} toAddress
	 * @param {float} amount
	 * @param {string} signature
	 * @param {string} txHash
	 *
	**/
	constructor( fromAddress, toAddress, amount, signature, txHash ) {
		this.fromAddress = fromAddress;
		this.toAddress = toAddress;
		this.amount = amount;
		this.signature = signature;
		this.txHash = txHash;
	}

	/**
	 * A SHA256 hash is generated with the parameters fromAddress, toAddress, amount and converted to string.
	 * This hash is used while verifying the signature of the transaction object.
	 *
	 * @returns {string}
	**/
	calculateHash() {
		return SHA256( this.fromAddress + this.toAddress + this.amount ).toString();
	}

	/**
	 * Checks and returns a Boolean value that is current transaction is valid or not by
	 * checking the signature and verifying it with the hash from the calculateHash() method.
	 * Special case/System case: if fromAddress is "system" them we ignore signature.
	 * This transactions happen to reward clients from system.
	 *
	 * @returns {boolean}
	**/
	isTransactionValid() {
		if( this.fromAddress == "system" ) return true; // mining reward case
		if( this.signature == null || this.signature.length == 0 ) {
			throw new Error( 'no signature here' );
		}
		var key = ec.keyFromPublic( this.fromAddress, 'hex' );
		return key.verify( this.calculateHash(), this.signature );
	}
}

class Block {

	/**
	 * A Block which maintains timestamp, transactions, hash, previousHash, mineHelper.
	 * A hash is generated for these params by mining with a desired severity level which is stored inside the Block and
	 * later on store into the blockChain.
	 *
	 * @param {number} timestamp
	 * @param {Transaction[]} transactions
	 * @param {string} previousHash
	 *
	**/
	constructor( timestamp, transactions, previousHash = '' ) {
		this.timestamp = timestamp;
		this.transactions = transactions;
		this.previousHash = previousHash;
		this.hash = this.calculateHash();
		this.mineHelper = 0; // nonce
		this.merkleTreeRootHash = null;
	}

	/**
	 * A SHA256 hash is generated with the parameters timestamp, transactions, previousHash, mineHelper and converted to string.
	 * This hash is used to identify the block and for validating the block and the chain if it is tampered or not.
	 *
	 * @returns {string}
	**/
	calculateHash() {
		return SHA256( this.timestamp + JSON.stringify( this.transactions ) +  this.previousHash + this.mineHelper + this.merkleTreeRootHash ).toString();
	}

	/**
	 * generates and returns merkletree root hash for list of transactions
	 *
	 * @returns {string}
	**/
	createMerkleTreeHash() {
		const leaves = this.transactions.map( tx => SHA256( tx ) );
		const tree = new MerkleTree( leaves, SHA256 );
		this.merkleTreeRootHash = tree.getRoot().toString( 'hex' );
		return this.merkleTreeRootHash;
	}

	/**
	 * Signs the hash of the block with the signingKey generated for the node and store it in the block
	 * 
	**/
	signBlock( blockHash ) {
		const signature = signingKey.sign( blockHash, 'base64' );
		this.signature = signature.toDER( 'hex' );
	}

	/**
	 * Mining a block with a desired severity level.
	 * Sets the hash for the block until hash is created with preceeding severity count of zero's.
	 * mineHelper variable is used to skip the infinite loop while mining block.
	 *
	 * @param {string} severity
	 * 
	**/
	mineBlock( severity ) {
		this.createMerkleTreeHash();
		while( this.hash.substring( 0, severity ) !== Array( severity + 1 ).join( '0' ) ) {
			this.mineHelper++;
			this.hash = this.calculateHash();
		}
		console.log( "Block Mininig finished.........", this.hash );
		return this.hash;
	}

	/**
	 * Returns merkleTree Proof
	 *
	 * @returns {string}
	**/
	merkleTreeProof() {
		// merkle tree proof
		const leaves = this.transactions.map( tx => SHA256( tx ) );
		const tree = new MerkleTree( leaves, SHA256 );
		const root = tree.getRoot().toString( 'hex' );
		const leaf = SHA256( this.transactions[ 0 ] );
		const proof = tree.getProof( leaf )
		return tree.verify( proof, leaf, root );
	}

	/**
	 * Returns true if block contains a valid sigature
	 *
	 * @returns {string}
	**/
	validBlock() {
		if( this.signature == null || this.signature.trim() == '' ) {
			throw new Error( "No signature for block" );
		}
		if( !this.merkleTreeProof() ) return false;
		return signingKey.verify( this.hash, this.signature );
	}

	/**
	 * Loops over all transactions in the block and verifies each transaction using isTransactionValid() from Transaction class.
	 * Returns false if any transaction is invalid, and true if all transactions are valid.
	 *
	 * @returns {string}
	**/
	hasValidTransactions() {
		for( const tx of this.transactions ) {
			if( !tx.isTransactionValid() ) {
				return false;
			}
		}
		return true;
	}

}

class BlockChain {

	/**
	 * A Blockchain which maintains chain of blocks, pendingTransactions to be inserted into a block for desired condition.
	 * First block of blockchain is created manually and next blocks will maintain hash of its previous block to maintain security and avoid tampering.
	 * Each block is created by mining pendingTransactions after a desired condition like size of block or time-interval of transaction and added to the chain.
	 * A desired amount of reward balance is given by the system to the wallet address for each successful mining a block.
	 *
	**/
	constructor() {
		this.chain = [ this.initiateGenisisBlock() ];
		this.severity = 2;
		this.pendingTransactions = [];
		this.miningReward = 100;
	}

	/**
	 * Returns a manually created Block which is called as Genesis Block
	 *
	 * @returns {Block}
	**/
	initiateGenisisBlock() {
		return new Block( Date.parse('2021-02-12'), "Genisis Block", "0" );
	}

	/**
	 * Returns latest block created from the chain
	 *
	 * @returns {Block}
	**/
	getLastBlock() {
		return this.chain[ this.chain.length - 1 ];
	}

	/**
	 * Returns index of the block identified by the hash of the block within the chain
	 *
	 * @param {string} hash
	 * 
	 * @returns {number}
	**/
	getBlockIndex( hash ) {
		return this.chain.findIndex( ( block ) => block.hash == hash );
	}

	/**
	 * Returns block identified by the hash of the block within the chain.
	 * If not found throws an error with a message
	 *
	 * @param {string} hash
	 * 
	 * @returns {Block}
	**/
	getBlockFromHash( hash ) {
		const blockIndex = this.getBlockIndex( hash );
		if( blockIndex >= 0 ) return this.chain[ blockIndex ];
		else throw new Error( "block with hash:" + hash + " not found" );
	}

	/**
	 * Returns previous block identified by the hash of the current block within the chain.
	 * If not found throws an error with a message
	 *
	 * @param {string} hash
	 * 
	 * @returns {Block}
	**/
	getPreviousBlockFromHash( hash ) {
		const blockIndex = this.getBlockIndex( hash );
		if( blockIndex >= 0 ) {
			const previousBlockIndex = this.getBlockIndex( hash ) - 1;
			if( previousBlockIndex >= 0 ) return this.chain[ previousBlockIndex ];
			else throw new Error( "There is no previous block for Genesis block" );
		} else {
			throw new Error( "block with hash:" + hash + " not found" );
		}
	}

	/**
	 * Creates a new block with all the pending transactions and starts the mining.
	 * Also adds as transaction from system to the wallet address as a reward.
	 * Adds the created block into the chain and reset the pending transactions.
	 *
	 * @param {string} miningRewardAdress
	 * 
	**/
	minePendingTransactions( miningRewardAdress ) {
		this.pendingTransactions.push( new Transaction( "system", miningRewardAdress, this.miningReward ) ); // reward
		let newBlock = new Block( Date.now(), this.pendingTransactions, this.getLastBlock().hash );
		console.log( "Mininig Block........." );
		var blockHash = newBlock.mineBlock( this.severity );
		newBlock.signBlock( blockHash );
		if( newBlock.validBlock() ) {
			this.chain.push( newBlock );
			this.pendingTransactions = []; //reset
		}
	}

	/**
	 * Creates a new block with all the system transactions and starts the mining.
	 * This is for testing purpose to provide initial balance for the clients.
	 * Adds the created block into the chain and removes the system transactions from pending transactions 
	 * as same should not be repeated in next blocks of the chain.
	 *
	 * 
	**/
	mineSystemTransactions() {
		let systemTransactions = this.pendingTransactions.filter( ( val ) => val.fromAddress == "system" );
		let newBlock = new Block( Date.now(), systemTransactions, this.getLastBlock().hash );
		console.log( "Mininig Block........." );
		var blockHash = newBlock.mineBlock( this.severity );
		newBlock.signBlock( blockHash );
		if( newBlock.validBlock() ) {
			this.chain.push( newBlock );
			this.pendingTransactions = this.pendingTransactions.filter( ( val ) => val.fromAddress != "system" );
		}
	}

	/**
	 * Returns the balance of the provided walletAddress by looping all over the blocks and transactions inside the block.
	 *
	 * @param {string} walletAddress
	 * 
	 * @returns {number}
	**/
	getBalanceOfAddress( walletAddress ) {
		let balance = 0;
		for ( const block of this.chain ) {
			for ( const txs of block.transactions ) {
				if( walletAddress == txs.fromAddress ) balance -= txs.amount;
				if( walletAddress == txs.toAddress ) balance += txs.amount;
			}
		}
		return balance;
	}

	/**
	 * Returns all the list of transactions by looping over the blocks of the chain and transactions inside the block.
	 *
	 * @param {string} walletAddress
	 * 
	 * @returns {Transaction[]}
	**/
	getAllTransactionsForWallet( walletAddress ) {
		const txs = [];
		for( const block of this.chain ) {
			for(const tx of block.transactions ) {
				if( tx.fromAddress === walletAddress || tx.toAddress === walletAddress ) {
					txs.push( tx );
				}
			}
		}
		return txs;
	}

	/**
	 * Adds the newTransaction object into the pendingTransactions list of the blockchain.
	 * Before adding will do the validations like schema of the transaction object,
	 * signature of the transaction, negative value in amount, less balance than amount transaction.
	 *
	 * @param {Transaction} newTransaction
	 * 
	**/
	addTransaction( newTransaction ) {

		// schema validation
		if( !newTransaction.fromAddress || !newTransaction.toAddress ) {
			throw new Error( "from and to address are required for a transaction" );
		}

		// amount validation
		if( newTransaction.amount <= 0 ) {
			throw new Error( "Transaction Amount should not be in negative or 0" );
		}

		// signature verification
		if( !newTransaction.isTransactionValid() ) {
			throw new Error( "cannot add invalid transaction" );
		}

		// amount sent should not be greater than wallet balance
		if ( newTransaction.fromAddress != "system" && this.getBalanceOfAddress( newTransaction.fromAddress ) < newTransaction.amount) {
			throw new Error( "Not enough balance" );
		}
	
		this.pendingTransactions.push( newTransaction );
	}

	/**
	 * Checks the chain validation by looping all over the blocks in the chain and each transaction of the block.
	 * It verifies if they are properly linked together and nobody has tampered with the hashes.
	 *
	 * @returns {boolean}
	 *  
	**/
	isChainValid() {
		const originalGenesis = JSON.stringify( this.initiateGenisisBlock() );
		if ( originalGenesis !== JSON.stringify( this.chain[0] ) ) {
			return false;
		}
		for( let i = 1; i < this.chain.length; i++ ) {
			const currentBlock = this.chain[ i ];
			const previousBlock = this.chain[ i - 1 ];
			if( previousBlock.hash !== currentBlock.previousHash ) {
				return false;
			}
			// validate signature of block
			if( !currentBlock.merkleTreeProof() || !( signingKey.verify( currentBlock.mineBlock( this.severity ), currentBlock.signature ) ) ) {
				return false;
			}
			// validate each transaction of the block
			if( !currentBlock.hasValidTransactions() ) {
				return false;
			}
			// validate hash that is tampered or not
			if( currentBlock.hash !== currentBlock.calculateHash() ) {
				return false;
			}
		}
		return true;
	}
}

module.exports.BlockChain = BlockChain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;
