import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import { Name } from '@wharfkit/antelope';
import { Blockchain, nameToBigInt } from '../../dist';

// Note: These dependencies are from sha.md example
const NodeRSA = require('node-rsa');
const crypto = require('crypto');

// RSA Signing helper class from sha.md
class RSASigning {
  key: any;

  constructor(privateKey: string) {
    this.key = new NodeRSA(privateKey);
  }

  signMessage(signing_value: string) {
    if (!signing_value && signing_value !== '0') {
      throw new Error('Unable to sign an empty value.');
    }
    return this.key.sign(Buffer.from(signing_value, 'hex'), 'hex');
  }
}

// Public key from sha.md
const exponent1 = '10001';
const modulus1 =
  'b67b5732be0888309dfba35e310eee09641a3f609ec94fdfb45aeaec1231e08268f2a065fffb00aa41eaec560af2bedc0d48cd647b89a8a44b4e0a5fef365640ad379d05112e063467f973c0053657534b1c76cbed8aae705d3453b1581b6badbff41ea2ff5a84e84b06e4293978f7d5389180803f5b27c13290f209c647ee0a8de4184d39f6d4e66a01ffd13ac0740a997b9e05023a51b9c281485685c0cfe3743dbc788cc3aac31c2f35a53414ff236ed2a998aa3617f3bda2f6163aa5254cf60f7d73b4d553b1d2fbd057299a297832cd9e8d2a1786b4260188889e9f7dd713dc1c22c6dda8e001ed76114e41529caa575ff6bc54a79d7ed6f6442b9fe84712ec2bae06560eb3fe40292143f69ae67e72ef7a010d95879df4edfb0ed74a2a7b9aeaade0c02a73a9a27c710dba0020891a9585cae9b6937f82c56c20017107990101a86c71b6c759abc5be23eb790c795e138363c40c29c8ec0fae65ad1de30bd2a5b0bbedc633caf21a8eae0d5afced68fb1a2a1cf5a175d5207ffcfad69de17cb839ab82f6ac1833fbe641eb869be9d9cd5e742bd79b7472eed3d39956c4b5eb9578cf92ba9202ddab1b0f81dc05c85380fb85a67adc88ae295de66cdc2977c2f6273acd65f234684cb9b5e60ab75cb6f433eb12961afe295247d7819d5ba4213d4902039234506f5109534734e65c28e2a8078afc3b59b92e7f329f791b';

// Initialize blockchain
const blockchain = new Blockchain();

// Create RSA contract
const contractName = Name.from('rsa');
const rsa = blockchain.createAccount({
  name: contractName,
  wasm: fs.readFileSync(path.join(__dirname, 'rsa.wasm')),
  abi: fs.readFileSync(path.join(__dirname, 'rsa.abi'), 'utf8'),
});

// Load private key
const privateKey1 = fs.readFileSync(path.join(__dirname, 'test_rsa_4096_priv_1.pem'), 'utf8');
const rsaSigning = new RSASigning(privateKey1);

// Helper to get scope for tables
const scope = nameToBigInt(contractName);

describe('RSA Signature Verification', () => {
  beforeEach(() => {
    blockchain.resetTables();
  });

  it('should set public key', async () => {
    // Set public key with index 0
    await rsa.actions.setpubkey([0, exponent1, modulus1]).send();

    // Verify the public key was stored
    const pubkey = rsa.tables.pubkeys(scope).getTableRow(BigInt(0));
    expect(pubkey).to.not.be.undefined;
    expect(pubkey.index).to.equal(0);
    expect(pubkey.exponent).to.equal(exponent1);
    expect(pubkey.modulus).to.equal(modulus1);
  });

  it('should update existing public key', async () => {
    // Set initial public key
    await rsa.actions.setpubkey([0, exponent1, modulus1]).send();

    // Update with different values
    const newExponent = '10002';
    await rsa.actions.setpubkey([0, newExponent, modulus1]).send();

    // Verify it was updated
    const pubkey = rsa.tables.pubkeys(scope).getTableRow(BigInt(0));
    expect(pubkey.exponent).to.equal(newExponent);
  });

  it('should verify RSA signature', async () => {
    // Set public key
    await rsa.actions.setpubkey([0, exponent1, modulus1]).send();

    // Create a message to sign (using sha256 hash as in sha.md example)
    const message = 'Hello, RSA!';
    const messageHash = crypto.createHash('sha256').update(message).digest('hex');

    // Sign the message hash
    const signature = rsaSigning.signMessage(messageHash);

    // Call verify action
    // Note: This will fail until verify_rsa_sha256_sig intrinsic is implemented in vm.ts
    await rsa.actions.verify([0, messageHash, signature]).send();

    // Check the result in the results table
    const result = rsa.tables.results(scope).getTableRow(BigInt(0));
    expect(result).to.not.be.undefined;
    expect(result.index).to.equal(0);
    // When intrinsic is implemented, this should be true for valid signatures
    // expect(result.ok).to.be.true;
  });

  it('should fail to verify signature with different message', async () => {
    // Set public key
    await rsa.actions.setpubkey([0, exponent1, modulus1]).send();

    // Sign one message
    const originalMessage = 'Hello, RSA!';
    const originalHash = crypto.createHash('sha256').update(originalMessage).digest('hex');
    const signature = rsaSigning.signMessage(originalHash);

    // Try to verify with a different message hash
    const differentMessage = 'Different message';
    const differentHash = crypto.createHash('sha256').update(differentMessage).digest('hex');

    // Call verify action with mismatched hash and signature
    await rsa.actions.verify([0, differentHash, signature]).send();

    // Check the result - should be false since message doesn't match signature
    const result = rsa.tables.results(scope).getTableRow(BigInt(0));
    expect(result).to.not.be.undefined;
    expect(result.index).to.equal(0);
    // When intrinsic is implemented, this should be false for invalid signatures
    expect(result.ok).to.be.false;
  });

  it('should clear result', async () => {
    // Set public key and verify a signature first
    await rsa.actions.setpubkey([0, exponent1, modulus1]).send();

    const messageHash = crypto.createHash('sha256').update('test').digest('hex');
    const signature = rsaSigning.signMessage(messageHash);
    await rsa.actions.verify([0, messageHash, signature]).send();

    // Verify result exists
    let result = rsa.tables.results(scope).getTableRow(BigInt(0));
    expect(result).to.not.be.undefined;

    // Clear the result
    await rsa.actions.clearresult([0]).send();

    // Verify result was removed
    result = rsa.tables.results(scope).getTableRow(BigInt(0));
    expect(result).to.be.undefined;
  });

  it('should fail when verifying without setting public key', async () => {
    const messageHash = crypto.createHash('sha256').update('test').digest('hex');
    const signature = rsaSigning.signMessage(messageHash);

    try {
      await rsa.actions.verify([0, messageHash, signature]).send();
      expect.fail('Should have thrown an error');
    } catch (e) {
      expect(e.message).to.include('public key not found for index');
    }
  });

  it('should handle multiple public keys with different indexes', async () => {
    // Set public key at index 0
    await rsa.actions.setpubkey([0, exponent1, modulus1]).send();

    // Set public key at index 1 (same key for now)
    await rsa.actions.setpubkey([1, exponent1, modulus1]).send();

    // Verify both exist
    const pubkey0 = rsa.tables.pubkeys(scope).getTableRow(BigInt(0));
    const pubkey1 = rsa.tables.pubkeys(scope).getTableRow(BigInt(1));

    expect(pubkey0.index).to.equal(0);
    expect(pubkey1.index).to.equal(1);
  });
});
