# storecloud-test


## Concepts involved:
 - Merkle tree root hash for transactions
 - Simple Proof-of-work algorithm( mineBlock )
 - Sign Block
 - Validate Block
 - Sign Transactions
 - Validate Transactions
 - Validate BlockChain
 - Client identities generation ( elliptic key-pair )


 ## Cloning repository
    > git clone https://github.com/ArjunMamidi2698/storecloud-test.git
    > cd storecloud-test/

 ## Functionality:

- To create identities for the clients:
```
    const EC = require( 'elliptic' ).ec;
    const ec = new EC( 'secp256k1' );
    const signingKey = ec.genKeyPair(); // key-pair object
    var publicKey = signingKey.getPublic( 'hex' );
    var privateKey = signingKey.getPrivate( 'hex' );
```

 - To create merkletree root hash:
 ```
    const { MerkleTree } = require( 'merkletreejs' );
    const SHA256 = require( 'crypto-js/sha256' );
    const leaves = transactions.map( tx => SHA256( tx ) );
    const tree = new MerkleTree( leaves, SHA256 );
    merkleTreeRootHash = tree.getRoot().toString( 'hex' ); // store this in block
```
- To sign a message
```
    signingKey.sign( message, 'base64' ).toDER( 'hex' );
```
- Verify the signature
```
    // Verify the signature to check if tampering is done or not
    signingKey.verify( message, signature );
```

- To create BlockChain instance
```
    const { BlockChain } = require( '<path-to-blockchain.js>' );
    const ajCoin = new BlockChain();
```

- To add transactions:
```
    // generateSignedTransactionObject requires identities of client to sign the transaction
    const txObject = generateSignedTransactionObject( clientData, toAddress );
    var tx = new Transaction( fromAddress, toAddress, amount, signature, txHash );
    ajCoin.addTransaction( tx );
```

- To create block:
```
    // we mine a block for a specific condition and for successfull mining a miningReward amount is transfered to the address provided
    ajCoin.minePendingTransactions( miningRewardAddress );
```

## Install packages
    > npm i
    > npm i -g mocha

## Start Server
    > npm run server

## Start Client( open new terminal )
    > npm run client

## Run test cases
    > npm run test

## .env file
```
    // these can be changed for testing
    SERVER_PORT=2021 // server listening port
    CLIENT_PORT=3021 // client listening port

    MESSAGE_INTERVAL=1000 // add transaction for every second
    CLIENTS_COUNT=10 // clients count
```

## Api's exposed:
server port in the .env file should match the curl request port
```   
    - curl http://localhost:2021/getChain
        - retrieves chain of blockchain instance
    - curl http://localhost:2021/getFinishedBlocksCount
        - retrieves successfully mined blocks count

    - curl http://localhost:2021/getLatestBlock
        - retrieves latest added block
    - curl http://localhost:2021/getBlock/<index>
        - retrieves block at given index
    - curl http://localhost:2021/getBlock?hash=<hash>
        - retrieves block identified by given hash
    - curl http://localhost:2021/getPreviousBlock?hash=<hash>
        - retrieves previous block identified by given hash

    - curl http://localhost:2021/getBalance/<address>
        - retrieves balance for given wallet address
    - curl http://localhost:2021/getAllTransactions/<address>
        - retrieves all transactions for given wallet address
    - curl http://localhost:2021/getPendingTransactions
        - retrieves all pending transactions to be mined
```

## Postman collection:
https://www.getpostman.com/collections/9cf3508db07eaf774ef0