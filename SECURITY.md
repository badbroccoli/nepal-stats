# Security Policy

## Supported versions

Security fixes are applied to the default branch (`main`) of this repository.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email the maintainers at **me@hemanta.com** with:

- A short description of the issue and its impact
- Steps to reproduce, or a proof of concept if available
- Affected paths, APIs, or versions if known

You should receive an acknowledgment within a few days. We will coordinate a fix and disclosure timeline with you.

## Scope

In scope:

- The Next.js app at the repository root
- Public HTTP API routes under `/api/*`
- Repository configuration and CI that could leak secrets or weaken supply-chain integrity

Out of scope:

- Third-party upstream data providers (NRB, USGS, BIPAD, RSS feeds, WAQI, World Bank)
- Denial-of-service against shared hosting infrastructure beyond reasonable rate limits

## Secrets

Never commit API tokens or `.env` files. Optional live AQI uses `WAQI_TOKEN` as a **server-only** environment variable. Prefer GitHub Actions secrets / host env vars for production.
