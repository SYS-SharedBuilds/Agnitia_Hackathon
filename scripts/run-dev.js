const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const isWin = process.platform === 'win32';
const venvPy = isWin
  ? path.resolve(__dirname, '..', '.venv', 'Scripts', 'python.exe')
  : path.resolve(__dirname, '..', '.venv', 'bin', 'python');

const pyCmd = fs.existsSync(venvPy) ? venvPy : (isWin ? 'python' : 'python3');
const devScript = path.resolve(__dirname, 'dev.py');

const child = spawn(pyCmd, [devScript, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
