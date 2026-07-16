# VeRT

**VM emulation RunTime for WASM-based blockchain contracts**

> `@atomichub/vert` is a maintained fork of [`@waxio/vert`](https://github.com/worldwide-asset-exchange/wax-vert), itself a fork of [`@vaulta/vert`](https://github.com/eosnetworkfoundation/vert), originally written by Jeeyong "conr2d" Um. It exists to keep the harness current for contracts that deploy across several Antelope chains, where host functions differ per chain. See [Chain compatibility](#chain-compatibility). MIT throughout, with the upstream copyright notices preserved.

VeRT is a virtual machine emulator for Antelope blockchains.
It uses the built-in WebAssembly object in JavaScript, so can be executed on any modern browsers or runtime environments without additional dependencies.
It doesn't support the full specification of each blockchain state-machine, but can be used to run and test smart contracts before deployment.
The focus of VeRT is on the better compatibility than the performance, so it can be integrated with development pipelines.

- Run and test smart contracts
- Minimum dependencies (No native wrapper, docker or remote connection)
- Volatile key-value store with state rollback 

## Requirement

- WebAssembly binary with exported memory
- Nodejs v16 or higher (JavaScript runtime with WebAssembly BigInt support)

## Chain compatibility

Antelope chains do not all expose the same host functions, and a harness that offers more than the
target chain will link a contract that the chain rejects at `setcode`.

`verify_rsa_sha256_sig` is currently registered for every `Blockchain`. It exists on WAX; it does not
exist on EOS, Jungle4, or Vaulta. A contract that calls it therefore passes here and fails to load on
those chains. Until the host function set is selectable per chain, treat a passing suite as evidence
for WAX only when RSA is involved.

## Installation

```shell
npm install @atomichub/vert
```

## Example usage

```typescript
import { Blockchain, nameToBigInt, expectToThrow } from "@atomichub/vert";
import { assert } from "chai";

// instantiate the blockchain emulator
const blockchain = new Blockchain()

// Load a contract
const contract = blockchain.createContract(
    // The account to set the contract on
    'accountname', 
    // The path to the contract's wasm/abi
    // both wasm and abi files should be named yourcontract.wasm and yourcontract.abi
    'build/yourcontract' 
)


// You can clear the tables in the 
// contract before each test
beforeEach(async () => {
    blockchain.resetTables()
})

describe('Testing Suite', () => {
    it('should do X', async () => {
        // Create some accounts to work with
        const [alice, bob] = blockchain.createAccounts('alice', 'bob')
        
        // Will call a normal action. 
        // Returns an array of results if the action returns a value (array since inlines can also return values)
        const result = await contract.actions.youraction([param1, param2]).send();
        // You can also specify the authorization for the action
        // .send('alice@active')
        // default is the contract's account itself with 'active' permission
        
        // Will call a normal action, or a readonly action.
        // Returns a return value from the action, or null (no array)
        const readonlyResult = await contract.actions.youraction([param]).read();

        // You can get table data from the contract, though readonly actions 
        // are the preferred way to get data from external sources (web apps, apis, etc)
        const rows = contract.tables.yourtable(
            nameToBigInt('scope')
        ).getTableRow(
            nameToBigInt('primary.key')
        );

        // if you called 'print' in your contract, you can access the console output
        // after the action is executed
        console.log(contract.bc.console);

        // You can verify that an action throws an error
        expectToThrow(
            contract.actions.badaction([]).send(),
            'This will be "some error" from inside check(false, "some error")'
        )
    });
});
```



## Test

```shell
npm run test
```

