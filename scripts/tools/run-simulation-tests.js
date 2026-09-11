import { handleCalendlyBooking } from './backend/services/calendly-service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const TEST_PAYLOAD_1 = {
  name: "Cliente Sucesso Teste",
  email: "alygen.teste.sucesso@example.com",
  questions_and_answers: [
    { question: "Qual o seu telefone?", answer: process.env.WHATSAPP_PHONE || "+351900000000" }
  ],
  scheduled_event: {
    name: "Mentoria Estratégica Digital (30 min)",
    start_time: "2026-03-27T10:00:00Z",
    location: { join_url: "https://meet.google.com/abc-defg-hij" }
  }
};

const TEST_PAYLOAD_2 = {
  name: "Cliente Reagendar Teste",
  email: "alygen.teste.reagendar@example.com",
  questions_and_answers: [
    { question: "Telefone?", answer: process.env.WHATSAPP_PHONE || "+351900000000" }
  ],
  scheduled_event: {
    name: "Sessão de Diagnóstico (15 min)",
    start_time: "2026-03-27T11:00:00Z",
    location: { join_url: "https://meet.google.com/xyz-wxyz-xyz" }
  }
};

async function runTests() {
  console.log('🚀 DISPARANDO TESTE 1: Cliente Sucesso (Espera Aprovação)');
  await handleCalendlyBooking(TEST_PAYLOAD_1);
  
  console.log('\n----------------------------------------\n');
  
  console.log('🚀 DISPARANDO TESTE 2: Cliente Reagendar (Espera Recusa)');
  await handleCalendlyBooking(TEST_PAYLOAD_2);
  
  console.log('\n✅ Simulações enviadas! Verifica o teu Telegram agora.');
}

runTests();
