import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
    console.error('❌ Falta TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID no ficheiro .env');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

bot.sendMessage(chatId, "👋 Olá! Esta é uma mensagem de teste do teu CRM Deals Manager Autopilot.\n\nSe recebeste esta notificação, a integração entre o servidor e o teu telemóvel foi estabelecida com ✅ *sucesso*. \n\nEstou pronto para enviar aprovações de Leads para ti! 🚀", { parse_mode: 'Markdown' })
    .then(() => {
        console.log('✅ Mensagem de teste enviada com sucesso!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Erro ao enviar mensagem de teste:', err.message);
        process.exit(1);
    });
