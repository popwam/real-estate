const { spawn } = require('child_process');
const path = require('path');

let running = false;

function runAttendanceAutoCloseJob({ logger }) {
  if (running) return Promise.resolve({ status: 'already-running' });
  running = true;
  const repositoryRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  return new Promise((resolve, reject) => {
    const child = spawn(command, ['--filter', 'api', 'attendance:auto-close'], {
      cwd: repositoryRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += String(chunk); });
    child.stderr.on('data', (chunk) => { output += String(chunk); });
    child.on('error', (error) => {
      running = false;
      reject(error);
    });
    child.on('close', (code) => {
      running = false;
      if (code === 0) {
        logger.info('Attendance auto-close completed', { status: 'complete' });
        resolve({ status: 'complete' });
        return;
      }
      // Never relay job output: it might contain an infrastructure error. The
      // worker logs only a status and the process exit code.
      logger.warn('Attendance auto-close failed', { exitCode: code });
      reject(new Error(`attendance auto-close exited with ${code}`));
    });
  });
}

module.exports = { runAttendanceAutoCloseJob };
