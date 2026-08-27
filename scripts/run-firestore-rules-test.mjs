import net from 'node:net';
import { spawn } from 'node:child_process';

const host = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1';
const port = Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] || 8080);

function canConnect() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(1200, () => finish(false));
  });
}

if (!(await canConnect())) {
  console.error(`Firestore Emulator no disponible en ${host}:${port}.`);
  console.error('La integración no se ejecutó. Inicia Firebase Emulator Suite y repite npm run test:firestore.');
  process.exit(2);
}

const child = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'tests/firestore.rules.test.js'], {
  stdio: 'inherit',
  env: { ...process.env, FIRESTORE_EMULATOR_HOST: `${host}:${port}` },
});
child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 1));
});
