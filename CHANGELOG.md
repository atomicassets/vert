# Changelog

## [2.2.0]

Renames the package to `@atomichub/vert` and gates chain-specific host functions to the emulated chain.

### Breaking changes

- The package is published as `@atomichub/vert`, not `@waxio/vert`. Change the install name and every import to the new name. `0bb4d95`

### Features

- Host functions are gated per emulated chain. `new Blockchain({ chain: 'wax' })` opts into the WAX set, which includes `verify_rsa_sha256_sig`, and the generic default withholds chain-specific functions. A contract that passes the harness therefore also passes `setcode` on chains that do not provide them. (#1)

### Other changes

- The npm publish is tag-triggered and gated on the `npm-publish` environment. `prepack` builds `dist`, so a publish always ships compiled output. (#2)
