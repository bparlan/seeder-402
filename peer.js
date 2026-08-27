const CONTROL_PORT = process.env.CONTROL_PORT || 7001;
console.log(`peer stub starting on control port ${CONTROL_PORT}`);
setInterval(() => {
  console.log('peer stub alive');
}, 30000);
