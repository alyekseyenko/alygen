import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(token, { polling: false });

async function pingTelegram() {
  console.log('📡 Testando Conexão Telegram...');
  console.log(`Token: ${token?.substring(0, 10)}...`);
  console.log(`ChatId: ${chatId}`);

  try {
    const msg = "🆘 **TESTE DE CONEXÃO ALYGEN**\n\nRecebeste este sinal? Se sim, a linha está viva. Vou reenviar os agendamentos já de seguida.";
    const result = await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    console.log('✅ Sinal enviado com sucesso! Message ID:', result.message_id);
  } catch (err) {
    console.error('❌ ERRO NO TELEGRAM:', err.message);
  }
}

pingTelegram();
