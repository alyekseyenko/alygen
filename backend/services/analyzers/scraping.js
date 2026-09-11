import axios from 'axios';
import * as cheerio from 'cheerio';
import { deepScrapeWithPython } from '../python-bridge.js';
import logger from '../../utils/logger.js';

// Validar email
export function isValidEmail(email) {
  const invalidDomains = ['example.com', 'test.com', 'sentry.io', 'google.com', 'facebook.com'];
  const invalidExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf'];
  if (invalidExtensions.some(ext => email.toLowerCase().includes(ext))) return false;
  if (invalidDomains.some(domain => email.includes(domain))) return false;
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Validar telefone português
export function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\+\-\(\)]/g, '');
  if (cleaned.startsWith('351')) return /^351[29]\d{8}$/.test(cleaned);
  return /^[29]\d{8}$/.test(cleaned);
}

// Formatar telefone
export function formatPhone(phone) {
  const cleaned = phone.replace(/[\s\+\-\(\)]/g, '');
  if (cleaned.startsWith('351')) return `+351 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

// Buscar emails em uma página específica
export async function searchEmailsInPage(url, foundEmails) {
  try {
    const { data } = await axios.get(url, { timeout: 3000 });
    const $ = cheerio.load(data);
    
    $('a[href^="mailto:"]').each((i, el) => {
      const email = $(el).attr('href').replace('mailto:', '').split('?')[0].trim();
      if (email && isValidEmail(email)) foundEmails.add(email);
    });
    
    const emailRegex = /\b[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    const bodyText = $('body').text();
    const textEmails = bodyText.match(emailRegex) || [];
    textEmails.forEach(email => { if (isValidEmail(email)) foundEmails.add(email); });
  } catch (e) {
    logger.warn(`⚠️ Scraping fast failed for ${url}: ${e.message}`);
  }
}

// Buscar telefones em uma página específica
export async function searchPhonesInPage(url, foundPhones) {
  try {
    const { data } = await axios.get(url, { timeout: 3000 });
    const $ = cheerio.load(data);
    
    $('a[href^="tel:"]').each((i, el) => {
      const phone = $(el).attr('href').replace('tel:', '').trim();
      if (phone && isValidPhone(phone)) foundPhones.add(formatPhone(phone));
    });
    
    const bodyText = $('body').text();
    const phonePatterns = [
      /\+351\s?9\d{2}\s?\d{3}\s?\d{3}/g,
      /\+351\s?2\d{2}\s?\d{3}\s?\d{3}/g,
      /\b9\d{2}\s?\d{3}\s?\d{3}\b/g,
      /\b2\d{2}\s?\d{3}\s?\d{3}\b/g,
      /\b9\d{8}\b/g,
      /\b2\d{8}\b/g
    ];
    
    phonePatterns.forEach(pattern => {
      const matches = bodyText.match(pattern) || [];
      matches.forEach(phone => {
        const cleaned = phone.replace(/\s/g, '');
        if (isValidPhone(cleaned)) foundPhones.add(formatPhone(cleaned));
      });
    });
  } catch (e) {
    // Silent fail for noise
  }
}

// Extrair email principal do site
export async function extractEmail(url) {
  const foundEmails = new Set();
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  await searchEmailsInPage(baseUrl, foundEmails);
  const contactUrls = [`${baseUrl}/contactos`, `${baseUrl}/contacto`, `${baseUrl}/contato`, `${baseUrl}/fale-connosco`, `${baseUrl}/contact`, `${baseUrl}/contactos-e-localizacao`, `${baseUrl}/info`, `${baseUrl}/informacoes`, `${baseUrl}/equipa`, `${baseUrl}/sobre`, `${baseUrl}/contact-us`, `${baseUrl}/contacts` ];
  for (const contactUrl of contactUrls) {
    if (foundEmails.size >= 2) break;
    await searchEmailsInPage(contactUrl, foundEmails);
  }

  // 🐍 Python Deep Fallback (SPA check)
  if (foundEmails.size === 0) {
    logger.info(`🔎 JS falhou em achar email em ${baseUrl}. Ativando Python Deep Scraper...`);
    const deepResults = await deepScrapeWithPython(baseUrl);
    if (deepResults.success && deepResults.emails?.length > 0) {
      deepResults.emails.forEach(e => { if (isValidEmail(e)) foundEmails.add(e); });
    }
  }

  return Array.from(foundEmails).slice(0, 3);
}

// Extrair telefone principal do site
export async function extractPhone(url) {
  const foundPhones = new Set();
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;

  await searchPhonesInPage(baseUrl, foundPhones);
  const contactUrls = [`${baseUrl}/contactos`, `${baseUrl}/contacto`, `${baseUrl}/contato`, `${baseUrl}/fale-connosco`, `${baseUrl}/contact`, `${baseUrl}/contactos-e-localizacao`, `${baseUrl}/info`, `${baseUrl}/informacoes`, `${baseUrl}/equipa`, `${baseUrl}/sobre`, `${baseUrl}/contact-us`, `${baseUrl}/contacts` ];
  for (const contactUrl of contactUrls) {
    if (foundPhones.size >= 2) break;
    await searchPhonesInPage(contactUrl, foundPhones);
  }

  // 🐍 Python Deep Fallback
  if (foundPhones.size === 0) {
    logger.info(`🔎 JS falhou em achar telefone em ${baseUrl}. Ativando Python Deep Scraper...`);
    const deepResults = await deepScrapeWithPython(baseUrl);
    if (deepResults.success && deepResults.phones?.length > 0) {
      deepResults.phones.forEach(p => { if (isValidPhone(p)) foundPhones.add(formatPhone(p)); });
    }
  }

  return Array.from(foundPhones).slice(0, 3);
}
