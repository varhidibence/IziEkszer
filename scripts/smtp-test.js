// Kis diagnosztikai console app: kozvetlenul teszteli az SMTP AUTH-ot es egy
// teszt email kuldeset, teljesen a Firebase extension-tol fuggetlenul.
// Nincs hozza npm csomag, csak a Node beepitett "net" es "tls" moduljait hasznalja.
//
// Tamogatja mindket modot:
//   - Implicit TLS (Gmail 465-os port, ez az alapertelmezett): SMTP_PORT=465
//   - STARTTLS (pl. mas szolgaltato 587-es portja):            SMTP_PORT=587
//
// Hasznalat (PowerShell), Gmail pelda:
//   $env:SMTP_USER="fiok@gmail.com"; $env:SMTP_PASS="app-jelszo"; $env:SMTP_TO="cel@example.com"; node scripts/smtp-test.js
//
// Hasznalat (PowerShell), mas szolgaltato (STARTTLS, 587) pelda:
//   $env:SMTP_HOST="smtp-relay.example.com"; $env:SMTP_PORT="587"; $env:SMTP_USER="<login>"; $env:SMTP_PASS="<jelszo>"; $env:SMTP_FROM="izi.ekszer.elmeny@gmail.com"; $env:SMTP_TO="cel@example.com"; node scripts/smtp-test.js

'use strict';
const net = require('net');
const tls = require('tls');

const HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM = process.env.SMTP_FROM || USER;
const TO = process.env.SMTP_TO || USER;

if (!USER || !PASS) {
  console.error('Hianyzo SMTP_USER / SMTP_PASS kornyezeti valtozo.\n');
  console.error('Hasznalat (PowerShell, Brevo pelda):');
  console.error('  $env:SMTP_HOST="smtp-relay.brevo.com"; $env:SMTP_PORT="587"; $env:SMTP_USER="<login>"; $env:SMTP_PASS="<smtp kulcs>"; $env:SMTP_FROM="izi.ekszer.elmeny@gmail.com"; $env:SMTP_TO="cel@example.com"; node scripts/smtp-test.js');
  process.exit(1);
}

function b64(s) {
  return Buffer.from(s, 'utf8').toString('base64');
}

let socket;
let buffer = '';
let step = 'greeting';
let secure = PORT === 465;

function attachHandlers(sock) {
  sock.setEncoding('utf8');
  sock.on('data', onData);
  sock.on('error', (err) => {
    console.error('Kapcsolodasi hiba:', err.message);
    process.exit(1);
  });
  sock.on('close', () => console.log('[kapcsolat lezarva]'));
}

function onData(chunk) {
  buffer += chunk;
  const lines = buffer.split('\r\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (!line) continue;
    console.log(`< ${line}`);
    const code = line.slice(0, 3);
    const isFinalLineOfReply = line.charAt(3) !== '-';
    if (!isFinalLineOfReply) continue;
    handleReply(code, line);
  }
}

function send(line, label) {
  console.log(`> ${label || line}`);
  socket.write(line + '\r\n');
}

function fail(msg) {
  console.error('\nHIBA: ' + msg + '\n');
  send('QUIT');
  step = 'done';
}

function connect() {
  if (secure) {
    console.log(`[kapcsolodas TLS-sel] ${HOST}:${PORT}\n`);
    socket = tls.connect(PORT, HOST, { servername: HOST }, () => {});
  } else {
    console.log(`[kapcsolodas TCP-vel, STARTTLS varhato] ${HOST}:${PORT}\n`);
    socket = net.connect(PORT, HOST, () => {});
  }
  attachHandlers(socket);
}

function upgradeToTLS() {
  const plainSocket = socket;
  plainSocket.removeAllListeners('data');
  socket = tls.connect({ socket: plainSocket, servername: HOST }, () => {
    console.log('[TLS upgrade kesz - STARTTLS]\n');
    secure = true;
    attachHandlers(socket);
    send('EHLO localhost');
    step = 'ehlo';
  });
}

function handleReply(code, line) {
  switch (step) {
    case 'greeting':
      send('EHLO localhost');
      step = 'ehlo';
      break;

    case 'ehlo':
      if (!code.startsWith('2')) return fail('EHLO elutasitva: ' + line);
      if (!secure) {
        send('STARTTLS');
        step = 'starttls';
      } else {
        send('AUTH LOGIN');
        step = 'auth-user';
      }
      break;

    case 'starttls':
      if (!code.startsWith('2')) return fail('STARTTLS elutasitva: ' + line);
      upgradeToTLS();
      step = 'upgrading';
      break;

    case 'upgrading':
      break;

    case 'auth-user':
      if (code !== '334') return fail('AUTH LOGIN nem tamogatott vagy elutasitva: ' + line);
      send(b64(USER), '(base64 felhasznalonev elkuldve)');
      step = 'auth-pass';
      break;

    case 'auth-pass':
      if (code !== '334') return fail('Felhasznalonev elutasitva: ' + line);
      send(b64(PASS), '(base64 jelszo elkuldve)');
      step = 'auth-result';
      break;

    case 'auth-result':
      if (!code.startsWith('2')) return fail('HITELESITES SIKERTELEN: ' + line);
      console.log('\nSMTP hitelesites SIKERES!\n');
      send(`MAIL FROM:<${FROM}>`);
      step = 'mail-from';
      break;

    case 'mail-from':
      if (!code.startsWith('2')) return fail('MAIL FROM elutasitva: ' + line);
      send(`RCPT TO:<${TO}>`);
      step = 'rcpt-to';
      break;

    case 'rcpt-to':
      if (!code.startsWith('2')) return fail('RCPT TO elutasitva: ' + line);
      send('DATA');
      step = 'data';
      break;

    case 'data': {
      if (code !== '354') return fail('DATA elutasitva: ' + line);
      const body = [
        `From: ${FROM}`,
        `To: ${TO}`,
        'Subject: SMTP teszt (console app)',
        '',
        'Ez egy teszt email a scripts/smtp-test.js console appbol.',
        '.'
      ].join('\r\n');
      send(body, '(email tartalom + lezaro pont elkuldve)');
      step = 'sent';
      break;
    }

    case 'sent':
      if (!code.startsWith('2')) return fail('Kuldes elutasitva: ' + line);
      console.log('\nTESZT EMAIL ELKULDVE! Nezd meg a postafiokot.\n');
      send('QUIT');
      step = 'done';
      break;

    case 'done':
      socket.end();
      break;
  }
}

connect();
