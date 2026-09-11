import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { logContact } from './supabase-service.js';

let client = null;
let isReady = false;
let isInitializing = false;

function getClient() {
  if (client) return client;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './data/whatsapp-session' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    console.log('\n📱 WhatsApp QR Code — Scan com o teu telemóvel:\n');
    qrcode.generate(qr, { small: true });
    console.log('\n⏳ Aguardando scan...\n');
  });

  client.on('ready', () => {
    isReady = true;
    console.log('✅ WhatsApp conectado!');
  });

  client.on('disconnected', () => {
    isReady = false;
    client = null;
    isInitializing = false;
    console.log('⚠️ WhatsApp desconectado');
  });

  client.on('auth_failure', () => {
    isReady = false;
    client = null;
    isInitializing = false;
    console.log('⚠️ WhatsApp auth falhou — apaga a pasta data/whatsapp-session e reinicia');
  });

  client.initialize().catch(err => {
    console.error('⚠️ WhatsApp init error (não crítico):', err.message);
    isReady = false;
    client = null;
    isInitializing = false;
  });

  return client;
}

// Formatar número para formato WhatsApp (351912345678@c.us)
function formatNumber(phone) {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (!cleaned.startsWith('351')) cleaned = '351' + cleaned;
  return `${cleaned}@c.us`;
}

export async function initWhatsApp() {
  getClient();
}

export async function getWhatsAppStatus() {
  return {
    ready: isReady,
    initializing: isInitializing && !isReady
  };
}

export async function isWhatsAppRegistered(phone) {
  const wa = getClient();
  if (!isReady) return false;
  try {
    const chatId = formatNumber(phone);
    const numberId = await wa.getNumberId(chatId.replace('@c.us', ''));
    return !!numberId;
  } catch (e) {
    return false;
  }
}

export async function sendWhatsApp(phone, message, leadName = null, website = null) {
  const wa = getClient();

  if (!isReady) {
    throw new Error('WhatsApp não está conectado. Aguarda o scan do QR code.');
  }

  const chatId = formatNumber(phone);

  // Verificar se o número existe no WhatsApp
  const numberId = await wa.getNumberId(chatId.replace('@c.us', ''));
  if (!numberId) {
    await logContact({ leadName, website, type: 'no-whatsapp', phone, message: null });
    throw new Error(`O número ${phone} não está registado no WhatsApp.`);
  }

  await wa.sendMessage(numberId._serialized, message);
  await logContact({ leadName, website, type: 'whatsapp', phone, message });
  console.log(`✅ WhatsApp enviado para ${phone}`);
  return { success: true, to: phone };
}
