const express = require("express");
const app = express();
app.use(express.json());

const PAY_TO =
  process.env.PAY_TO || "0x3264bc359C14192F3c68Db9761F05Fbbc6A4D67B";
const NETWORK = process.env.NETWORK || "eip155:84532";
const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://x402.org/facilitator";

const x402 = (priceUsd, inputSchema, outputSchema) => ({
  sentence: "",
  priceUsd,
  input: inputSchema,
  output: outputSchema,
  network: NETWORK,
  payTo: PAY_TO,
  facilitator: FACILITATOR_URL,
});

const prices = {
  seed: "0.10",
  pin: "0.20",
  house: "0.50",
  status: "0.01",
};

const schemas = {
  seed: {
    input: { key: "string", kind: "hypercore|hyperdrive" },
    output: { leaseId: "string", until: "unix", peers: "int" },
  },
  pin: {
    input: { key: "string", until: "integer" },
    output: { leaseId: "string", until: "integer" },
  },
  house: {
    input: { key: "string" },
    output: {
      leaseId: "string",
      pearKey: "string",
      fetchUrl: "string",
      until: "integer",
      bytes: "integer",
    },
  },
  status: {
    input: { key: "string" },
    output: {
      live: "boolean",
      peers: "integer",
      bytes: "integer",
      lastSeen: "integer",
    },
  },
};

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/.well-known/x402", (req, res) => {
  res.json({
    version: "1.0",
    payment_systems: {
      [NETWORK]: {
        name: NETWORK.includes("84532") ? "Base Sepolia" : "Base",
        currency: "USDC",
        decimals: 6,
        symbol: "USDC",
      },
    },
    endpoints: [
      {
        path: "/v1/seed",
        method: "POST",
        price: { amount: prices.seed, currency: "USD" },
        schema: schemas.seed,
      },
      {
        path: "/v1/pin",
        method: "POST",
        price: { amount: prices.pin, currency: "USD" },
        schema: schemas.pin,
      },
      {
        path: "/v1/house",
        method: "POST",
        price: { amount: prices.house, currency: "USD" },
        schema: schemas.house,
      },
      {
        path: "/v1/status",
        method: "GET",
        price: { amount: prices.status, currency: "USD" },
        schema: schemas.status,
      },
    ],
  });
});

app.post("/v1/seed", (req, res) => {
  const { key } = req.body || {};
  if (!key)
    return res.status(400).json({ error: "Missing required field: key" });
  res.set(
    "PAYMENT-REQUIRED",
    JSON.stringify(x402(prices.seed, schemas.seed.input, schemas.seed.output)),
  );
  res
    .status(402)
    .json(x402(prices.seed, schemas.seed.input, schemas.seed.output));
});

app.post("/v1/pin", (req, res) => {
  const { key, until } = req.body || {};
  if (!key || until === undefined)
    return res
      .status(400)
      .json({ error: "Missing required fields: key, until" });
  res.set(
    "PAYMENT-REQUIRED",
    JSON.stringify(x402(prices.pin, schemas.pin.input, schemas.pin.output)),
  );
  res.status(402).json(x402(prices.pin, schemas.pin.input, schemas.pin.output));
});

app.post("/v1/house", (req, res) => {
  const { key } = req.body || {};
  if (!key)
    return res.status(400).json({ error: "Missing required field: key" });
  res.set(
    "PAYMENT-REQUIRED",
    JSON.stringify(
      x402(prices.house, schemas.house.input, schemas.house.output),
    ),
  );
  res
    .status(402)
    .json(x402(prices.house, schemas.house.input, schemas.house.output));
});

app.get("/v1/status", (req, res) => {
  const { key } = req.query;
  if (!key)
    return res
      .status(400)
      .json({ error: "Missing required query parameter: key" });
  res.set(
    "PAYMENT-REQUIRED",
    JSON.stringify(
      x402(prices.status, schemas.status.input, schemas.status.output),
    ),
  );
  res
    .status(402)
    .json(x402(prices.status, schemas.status.input, schemas.status.output));
});

module.exports = app;
