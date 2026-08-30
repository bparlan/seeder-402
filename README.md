# seeder-402

**An HTTP/MCP service for replicating buyer-supplied Hypercore/Hyperdrive keys for USDC on Base via x402.**

## Overview

seeder-402 implements an always-on replication service that sells access to buyer-supplied Hypercore/Hyperdrive keys on Base network. The system enables publishers to host up to 50MB bundles for 7 days, while maintaining 24-hour discovery keys and supporting lease-based access control.

## Architecture

Two processes, one VPS, one database:

```text
[Agent] --HTTP 402 / MCP--> [api] --Unix socket--> [blind-peer]
|
[SQLite]
```

- **api** (Node 22+): x402 middleware, MCP paid tools, lease JWT/HMAC, quotas, OpenAPI
- **blind-peer** (Holepunch CLI): DHT, Corestore, replication (no payments logic)
- **SQLite**: leases, payments, caps (v1 only)

### Verified Deployment Characteristics

The following has been confirmed in production on `seed.bparlan.com`:

- api and peer communicate over a **Unix domain socket**, not a TCP port.
- The socket file is created via **unlink-before-listen** so both containers see the same file through the shared bind mount.
- Socket ownership: `node:node` with mode `srwxr-xr-x`; only the owner needs connect/write.
- peer runs with `network_mode: host`; api runs on the Coolify HTTP proxy.
- Traefik/Coolify terminates TLS for `https://seed.bparlan.com`; Coolify serves api on HTTP internally.

## System Status

### Current Milestone
**M0 — Contract** (active)
- Implemented: Unpaid requests → 402 Base Sepolia USDC
- Implemented: Facilitator verify+settle → 200 `{ ok: true }`
- Exit criteria: `openapi.json` + `/.well-known/x402` committed; one Sepolia tx with `PAYMENT-RESPONSE`; curl recipe in PLAYBOOK
- Status: Money stub in progress; blind-peer pending

### Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for complete milestone tracking. Current focus: M7 (mainnet) for production readiness.

## Quick Start

### Prerequisites

```bash
# System dependencies
Node 22+
npm (or bun)
blind-peer-cli or blind-peering-cli
better-sqlite3 (npm)
```

### Environment Setup

```bash
# Configure environment (never commit)
export NETWORK=eip155:84532           # Base Sepolia
export PAY_TO=0x...                   # Payment recipient
export FACILITATOR_URL=https://x402.org/facilitator
export LEASE_SECRET=...              # JWT secret
export PEER_KEY=...                  # Blind-peer key
export STORE_PATH=/var/lib/seeder-402/corestore
export DB_PATH=/var/lib/seeder-402/leases.db
export MAX_KEYS=200
export MAX_BYTES_PER_KEY=52428800
export MAX_BODY_BYTES=52428800
export PRICE_SEED_USD=0.10
export PRICE_PIN_USD=0.20
export PRICE_HOUSE_USD=0.50
export PRICE_STATUS_USD=0.01
```

### Run

```bash
# Start blind-peer for DHT
blind-peer -s $STORE_PATH

# Start API
node dist/index.js
# or
bun tsx src/index.ts
```

### Testing

```bash
# Test unpaid request (should return 402)
curl -i https://HOST/v1/status?key=00..

# Test paid request (Sepolia)
Use @x402/fetch or CDP Payments MCP with test USDC
```

## Documentation

| Document | Purpose |
|----------|---------|
| [FRAMEWORK.md](docs/FRAMEWORK.md) | Architecture patterns, module organization, extension guidelines |
| [SPEC.md](docs/SPEC.md) | System specification, public APIs, data models |
| [ROADMAP.md](docs/ROADMAP.md) | Milestone progress, future plans, completed items |
| [PLAYBOOK.md](docs/PLAYBOOK.md) | Operational procedures, deployment, common tasks |
| [DATA.md](docs/DATA.md) | Database schema, configuration, data flow patterns |

## Project Structure

```
seeder-402/
├── AGENTS.md              # Agent entry point, build/test commands, conventions
├── README.md               # This file
├── docs/                   # Canonical documentation
│   ├── FRAMEWORK.md
│   ├── SPEC.md
│   ├── ROADMAP.md
│   ├── PLAYBOOK.md
│   ├── DATA.md
│   └── context/            # Background and architectural context
├── milestones/             # Active and archived milestones
│   └── archive/            # Archived milestone artifacts
└── .omp/                   # OhMyPi configuration
    └── config.yml          # Canonical project configuration
```

## OhMyPi Workflow

```
```omp
"Implement M0 only per ROADMAP.md and SPEC.md. Do not start M2."
After each M: run PLAYBOOK tests; commit; stop.
```

> **Note**: This repository is currently at M0 (contract/money stub). Implementation beyond M0 must wait for roadmap progression and revenue signals.

## Contribution

Follow the OhMyPi workflow:
1. Implement exactly one milestone per PR
2. Adhere strictly to SPEC.md requirements
3. Run PLAYBOOK.md tests after each change
4. Do not advance beyond assigned milestone without roadmap approval
5. Maintain current architecture (no microservices, no reimplementation of core DHT logic)

## License

Architecture and documentation under Apache 2.0. Implementation (when created) will follow project license.

---

*This repository is maintained by the p2primitive collective and follows strict milestone-based development discipline.*

## Project Configuration

```yaml
project_id: seeder-402
project_slug: seeder-402
mode: application  # framework: library, application: runnable service

mechanical_tooling:
  environment_manager: Node.js + npm (nodeenv)
  fast_linter_formatter: Prettier + ESLint (auto-fixable)
  pre_commit_framework: Husky
  type_checker: TypeScript
milestones:
  current: M0
  target: M7

requirements:
  node_version: "22.0.0"
  base_network: eip155:8453  # Mainnet (production)
  base_testnet: eip155:84532  # Base Sepolia (testing)
```