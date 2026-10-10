# Security

## Reporting a problem

Report security problems privately through GitHub:
https://github.com/syscli/dz-format/security/advisories/new

Please do not open a public issue for them. You will get an answer within
7 days.

A wrong validation rule counts as a security problem when it lets a
malformed value through in a way that could cause harm, for example a RIB
key check that accepts a mistyped account. Other wrong results are ordinary
bugs and can go in a public issue.

## Supported versions

Fixes go into the latest release. Until 1.0, there are no fixes for older
minor versions.

## What this package does and does not do

- It checks that a value is well formed. It does not check that an account,
  phone line or vehicle exists, and it must not be the only check before
  sending money.
- It has no runtime dependencies and makes no network calls.
- Releases are published from GitHub Actions with npm provenance, so each
  version on npm can be traced to the commit and workflow that built it. Check
  it with `npm audit signatures`.
