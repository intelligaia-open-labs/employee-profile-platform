# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately to **security@intelligaia.com**.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- The version / commit hash you tested against
- Any suggested mitigations

If you'd like an encrypted channel, request our PGP key in your initial email.

## Response timeline

- **Acknowledgement**: within 3 business days of receipt
- **Initial assessment**: within 7 business days
- **Status updates**: at least every 14 days until resolution
- **Fix + disclosure**: target 90 days from acknowledgement, sooner for critical issues

## Disclosure policy

We follow coordinated disclosure:

1. Reporter contacts us privately
2. We acknowledge, investigate, and develop a fix
3. We release a patched version
4. We publicly disclose the issue (with credit to the reporter, if desired) once users have had reasonable time to upgrade

We will not pursue legal action against good-faith security researchers who:

- Make every effort to avoid privacy violations, destruction of data, and interruption of service
- Only use exploits to the extent necessary to confirm a vulnerability
- Do not disclose the issue publicly until we've had a chance to fix it
- Do not access or modify other users' data

## Scope

In scope:

- Source code in this repository
- Default configurations and deployment patterns documented in this repository
- The seed script and default credentials behavior

Out of scope:

- Self-hosted instances run by third parties (report directly to that operator)
- Social engineering, physical attacks, or attacks requiring privileged access already granted
- Findings from automated tools without demonstrated exploitability
- Issues already known to us (we'll let you know)

## Supported versions

| Version | Supported |
|---|---|
| `main` | ✅ Yes |
| Tagged releases (latest 2) | ✅ Yes |
| Older releases | ❌ Please upgrade |

## Hall of fame

Researchers who report valid vulnerabilities will be credited here (with their consent) once the issue is publicly disclosed.

_None yet — be the first._
