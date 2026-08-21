# Changelog

## [2.3.0]

Declares a package entry point map, publishes with provenance, and fixes RSA signature verification in browser bundles.

### Upgrading

- The package declares an `exports` map, so `@atomichub/vert` and its `package.json` are the only resolvable entries. Import from the package name rather than reaching into `dist`. (#3)

### Bug fixes

- `verify_rsa_sha256_sig` returns the right answer inside a browser bundle. It read node's `Buffer` from the global object, which a bundler rewrites to `globalThis`, where no `Buffer` exists. The throw that followed was caught and reported as an invalid signature, so a valid signature verified as invalid. (#11)

### Other changes

- The published tarball no longer carries the test files under `src`. (#3)
- Publishes authenticate through npm trusted publishing and carry provenance. (#3)
- Package metadata gains `keywords`, `sideEffects`, and an author entry for AtomicHub. (#3)

## [2.2.0]

Renames the package to `@atomichub/vert` and gates chain-specific host functions to the emulated chain.

### Breaking changes

- The package is published as `@atomichub/vert`, not `@waxio/vert`. Change the install name and every import to the new name. `0bb4d95`

### Features

- Host functions are gated per emulated chain. `new Blockchain({ chain: 'wax' })` opts into the WAX set, which includes `verify_rsa_sha256_sig`, and the generic default withholds chain-specific functions. A contract that passes the harness therefore also passes `setcode` on chains that do not provide them. (#1)

### Other changes

- The npm publish is tag-triggered and gated on the `npm-publish` environment. `prepack` builds `dist`, so a publish always ships compiled output. (#2)
