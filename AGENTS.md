# AGENTS.md — seeder-402

## Repository Overview

**Project**: seeder-402 — An HTTP/MCP service for replicating buyer-supplied Hypercore/Hyperdrive keys for USDC on Base via x402.

**Architecture**: Two processes, one VPS, one database:
- `api` (Node 22+): x402 middleware, MCP paid tools, lease JWT/HMAC, quotas, OpenAPI
- `blind-peer` (Holepunch CLI): DHT, Corestore, replication (no payments logic)
- `SQLite`: leases, payments, caps (v1 only)

## Build and Test Commands

### Prerequisites

```bash
# System dependencies
Node 22+
blank-peer-cli or blind-peering-cli
better-sqlite3 or libsql (npm)
```

### Quick Start

```bash
# Start blind-peer for DHT
blind-peer -s $STORE_PATH

# Start API (Node)
node dist/index.js
# or
bun tsx src/index.ts
```

### Testing

1. **Test unpaid**:
   ```bash
   curl -i https://HOST/v1/status?key=00..
   expect 402 + PAYMENT-REQUIRED
   ```

2. **Test paid**:
   ```bash
   Use @x402/fetch or CDP Payments MCP with test USDC from Circle faucet.
   ```

### Integration Test Sequence

1. Create test Hypercore on laptop; note key
2. Pay `/v1/seed`
3. Kill laptop process
4. Second machine downloads via swarm using peer
5. `/v1/status live=true`
6. Wait until+1 with forced reaper → live=false or key removed

## Coding Conventions

### OhMyPi Workflow

```
omp
"Implement M1 only per ROADMAP.md and SPEC.md. Do not start M2."
After each M: run PLAYBOOK tests; commit; stop.
```

### Agentic Constraints

- **One transform per PR**: money stub → seeder glue → MCP → discovery → mainnet
- Do not "improve" architecture with microservices
- Prefer shelling to `blind-peer` / `blind-peering` over reimplementing DHT

## Canonical Artifact System Usage

- Follow framework architecture as documented in `docs/FRAMEWORK.md`
- Implement against `docs/SPEC.md` requirements exactly
- Track progress in `docs/ROADMAP.md`
- Maintain operational procedures in `docs/PLAYBOOK.md`
- All changes must satisfy current milestone (M1-M7) per roadmap

## Preferred Tool Patterns

### Build Tools
- **Node.js/TypeScript**: Primary stack
- **Bun**: Fast TypeScript execution
- **SQLite**: Local persistence (better-sqlite3)

### Payment & Infrastructure
- **x402**: Base USDC payment middleware
- **Holepunch/blind-peer**: P2P replication
- **MCP**: Model Context Protocol for paid tools

### Documentation
- GitHub-flavored Markdown
- Cross-reference between docs/ files
- Minimal inline comments; focus on documentation

## Technical Details

### Environment Configuration

See `docs/PLAYBOOK.md` for complete environment variable schema:

```bash
NETWORK=eip155:84532
PAY_TO=0x...
FACILITATOR_URL=https://x402.org/facilitator
LEASE_SECRET=...
PEER_KEY=...
STORE_PATH=/var/lib/seeder-402/corestore
DB_PATH=/var/lib/seeder-402/leases.db
```

### Expected Source Layout (per FRAMEWORK.md)

```
src/
├── http/         # Hono or Express + x402 routes
├── mcp/          # paidTool wrappers
├── payments/     # facilitator verify/settle glue
├── leases/       # create/verify punch tokens
├── seeder/       # addCore / seed drive
├── house/        # Hyperdrive → seed
├── status/       # peer/bytes/lastSeen from store
├── reaper/       # cron: drop expired leases
├── config.ts
└── db.ts

- deploy/
  - blind-peer.service
  - api.service

- docs/
  - openapi.json
  - well-known-x402.json

- tests/
```

### Milestone Progress

Current state: Implementation up to M1 (money stub only)
- M1: Unpaid → 402, facilitator verify+settle
- Target: Complete M7 (mainnet) for production readiness

### Deployment

1. VPS Ubuntu LTS, non-root user, firewall SSH + API only
2. Install Node, blind-peer-cli
3. `deploy/*.service enable`
4. TLS: Caddy or nginx reverse proxy
5. Configure NETWORK to eip155:8453 when M7

## Next Steps

For developers:
1. Implement M1 per ROADMAP.md and SPEC.md only
2. Run PLAYBOOK.md tests after each change
3. Commit progress; do not advance beyond assigned milestone
4. Maintain current architecture (no microservices)
5. Follow exact payment flows specified in SPEC