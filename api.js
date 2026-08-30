const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const PEER_SOCKET = process.env.PEER_SOCKET || '/data/ctrl/peer.sock';

app.get('/health', (req, res) => {
  res.json({ ok: true, peerSocket: PEER_SOCKET });