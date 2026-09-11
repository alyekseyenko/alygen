import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { calculateQScoreSimple } from './q-score-calculator.js';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

let serviceAccountAuth = null;
try {
  const credPath = join(__dirname, '..', 'google-credentials.json');
  const credentials = JSON.parse(readFileSync(credPath, 'utf8'));
  serviceAccountAuth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
} catch (err) {
  console.warn('ℹ️ (sheets.js) google-credentials.json não encontrado ou inválido. Usando API Key como fallback.');
}

let activeFetchLeadsPromise = null;

export async function fetchLeads() {
  if (activeFetchLeadsPromise) {
    console.log('⏳ (sheets.js) Busca de leads já em andamento, aproveitando a cache...');
    return activeFetchLeadsPromise;
  }

  activeFetchLeadsPromise = (async () => {
    try {
      let doc;
      try {
        doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log('✅ Connected to Google Sheets using Service Account JWT Auth');
      } catch (authError) {
        if (authError.message?.includes('401') || authError.message?.includes('auth') || authError.message?.includes('credentials')) {
          console.log('⚠️ Service Account Auth failed (401). Trying public API Key fallback...');
          doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, { apiKey: process.env.PAGESPEED_API_KEY });
          await doc.loadInfo();
          console.log('✅ Connected to Google Sheets using API Key fallback!');
        } else {
          throw authError;
        }
      }

      const sheet = doc.sheetsByTitle['Results'] || doc.sheetsByIndex[0];
      // ❌ NÃO CARREGAR TODAS AS CÉLULAS - Causa erro de memória em sheets grandes
      // await sheet.loadCells();

      console.log('📊 Buscando todos os leads do Google Sheets...');
      const rows = await sheet.getRows();

      const seenPlaceIds = new Set();
      const seenWebsites = new Set();

      console.log(`📊 Sheet: ${sheet.title}, Linhas: ${rows.length}`);

      const leads = rows
        .filter(row => row.get('website'))
        .reduce((acc, row) => {
          const placeId = row.get('place_id');
          const website = row.get('website');

          // Evitar duplicados por place_id ou website
          if ((placeId && seenPlaceIds.has(placeId)) || seenWebsites.has(website)) {
            return acc;
          }

          if (placeId) seenPlaceIds.add(placeId);
          seenWebsites.add(website);

          // ✅ Buscar telefone diretamente da linha (sem loadCells)
          let phone = row.get('phone') || '';

          // Limpar telefone se vier com erro
          if (phone && phone.includes('#ERROR')) {
            const phoneMatch = phone.match(/\+?351\s?\d{3}\s?\d{3}\s?\d{3}/);
            if (phoneMatch) {
              phone = phoneMatch[0];
            } else {
              const digitsMatch = phone.match(/\d{9}/);
              phone = digitsMatch ? digitsMatch[0] : '';
            }
          }

          // Formatar telefone se válido
          if (phone) {
            try {
              phone = phone.replace(/#ERROR!/g, '').trim();
              if (isValidPhoneNumber(phone, 'PT')) {
                const phoneNumber = parsePhoneNumber(phone, 'PT');
                phone = phoneNumber.formatInternational();
              } else if (!phone.startsWith('+') && phone.length === 9) {
                const testPhone = '+351' + phone;
                if (isValidPhoneNumber(testPhone, 'PT')) {
                  const phoneNumber = parsePhoneNumber(testPhone, 'PT');
                  phone = phoneNumber.formatInternational();
                }
              }
            } catch (e) {
              // Manter telefone original se falhar
            }
          }

          const gpsStr = row.get('gps_coordinates') || '';
          let latitude = null;
          let longitude = null;
          if (gpsStr) {
            try {
              const gpsObj = JSON.parse(gpsStr);
              latitude = gpsObj.latitude ? parseFloat(gpsObj.latitude) : null;
              longitude = gpsObj.longitude ? parseFloat(gpsObj.longitude) : null;
            } catch (e) {
              const match = gpsStr.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
              if (match) {
                latitude = parseFloat(match[1]);
                longitude = parseFloat(match[2]);
              }
            }
          }

          // Dynamically parse all 38 requested Google Sheets metadata fields
          const sheetFields = [
            'title', 'phone', 'website', 'rating', 'reviews', 'type', 'address', 'price', 'place_id', 
            'position', 'data_id', 'data_cid', 'reviews_link', 'photos_link', 'gps_coordinates', 
            'place_id_search', 'provider_id', 'types', 'open_state', 'hours', 'operating_hours', 
            'description', 'service_options', 'order_online', 'thumbnail', 'editorial_reviews', 
            'unclaimed_listing', 'reserve_a_table', 'user_review', 'amenities', 'book_online', 
            'type_id', 'type_ids', 'extensions', 'serpapi_thumbnail', 'unsupported_extensions', 
            'extracted_price', 'country'
          ];
          
          const rawSheetData = {};
          sheetFields.forEach(f => {
            const val = row.get(f);
            rawSheetData[f] = val !== undefined && val !== null ? val : '';
          });

          acc.push({
            id: row.rowNumber,
            name: row.get('title') || row.get('website'),
            phone: phone,
            website: website,
            rating: row.get('rating') || '',
            reviews: row.get('reviews') || '',
            type: row.get('type') || '',
            types: row.get('types') || '',
            place_id: placeId || '',
            address: row.get('address') || '',
            description: row.get('description') || '',
            latitude: latitude,
            longitude: longitude,
            status: 'pending',
            sheet_metadata: rawSheetData
          });

          return acc;
        }, []);

      // Extrair categorias únicas
      const categories = [...new Set(
        leads
          .map(l => l.type)
          .filter(Boolean)
          .map(t => t.trim())
      )].sort();

      console.log(`✅ ${leads.length} leads carregados`);
      console.log(`📞 Leads com telefone: ${leads.filter(l => l.phone).length}`);

      return { leads, categories };
    } catch (error) {
      console.error('❌ Erro ao buscar leads do Google Sheets:', error.message);
      throw error;
    } finally {
      activeFetchLeadsPromise = null;
    }
  })();
  return activeFetchLeadsPromise;
}

export async function saveAnalysisToSheet(website, leadData, analysis) {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Buscar ou criar aba "WebList"
    let webListSheet = doc.sheetsByTitle['WebList'];

    if (!webListSheet) {
      console.log('📝 Criando aba WebList...');
      webListSheet = await doc.addSheet({
        title: 'WebList',
        headerValues: [
          'Website',
          'Nome',
          'Tipo',
          'Endereço',
          'Telefone',
          'Rating',
          'Reviews',
          'Performance Desktop',
          'Performance Mobile',
          'SEO Score',
          'Segurança Score',
          'Acessibilidade Score',
          'Tracking Total',
          'Meta Pixel',
          'Google Analytics',
          'GTM',
          'CTAs Total',
          'WhatsApp',
          'Email Extraído',
          'Q Score',
          'Q Grade',
          'Q Opportunity',
          'Q Potential',
          'Preço Estimado',
          'Timeline (semanas)',
          'Prioridade',
          'Data Análise',
          'Overall Score'
        ]
      });
    }

    // Buscar se já existe
    // 🔄 Otimizado: Buscar linha em chunks para evitar erro de memória
    let existingRow = null;
    const CHUNK_SIZE_SEARCH = 2000;
    let offsetSearch = 0;
    while (true) {
      console.log(`🔍 Procurando ${website} no WebList (offset ${offsetSearch})...`);
      const chunk = await webListSheet.getRows({ offset: offsetSearch, limit: CHUNK_SIZE_SEARCH });
      if (chunk.length === 0) break;
      existingRow = chunk.find(row => row.get('Website') === website);
      if (existingRow || chunk.length < CHUNK_SIZE_SEARCH) break;
      offsetSearch += CHUNK_SIZE_SEARCH;
    }

    // Preparar dados
    const qScoreData = analysis.qScore || calculateQScoreSimple(analysis);
    const pricing = calculatePricingForSheet(analysis, qScoreData);

    const rowData = {
      'Website': website,
      'Nome': leadData?.name || '',
      'Tipo': leadData?.type || '',
      'Endereço': leadData?.address || '',
      'Telefone': leadData?.phone || '',
      'Rating': leadData?.rating || '',
      'Reviews': leadData?.reviews || '',
      'Performance Desktop': analysis.performanceScore || 0,
      'Performance Mobile': analysis.performanceMobile || 0,
      'SEO Score': analysis.seo?.score || 0,
      'Segurança Score': analysis.security?.score || 0,
      'Acessibilidade Score': analysis.accessibility?.score || 0,
      'Tracking Total': analysis.pixelDetails?.totalTracking || 0,
      'Meta Pixel': analysis.pixelDetails?.facebook ? 'Sim' : 'Não',
      'Google Analytics': analysis.pixelDetails?.ga4 ? 'Sim' : 'Não',
      'GTM': analysis.pixelDetails?.gtm ? 'Sim' : 'Não',
      'CTAs Total': analysis.conversion?.ctas?.total || 0,
      'WhatsApp': analysis.conversion?.contact?.whatsapp ? 'Sim' : 'Não',
      'Email Extraído': analysis.extractedEmails?.[0] || '',
      'Q Score': qScoreData.score,
      'Q Grade': qScoreData.grade,
      'Q Opportunity': qScoreData.opportunity,
      'Q Potential': qScoreData.potential,
      'Preço Estimado': pricing.total,
      'Timeline (semanas)': pricing.timeline,
      'Prioridade': analysis.priority || '',
      'Data Análise': new Date().toISOString(),
      'Overall Score': analysis.overallScore || 0
    };

    if (existingRow) {
      // Atualizar existente
      console.log(`🔄 Atualizando ${website} no WebList...`);
      Object.keys(rowData).forEach(key => {
        existingRow.set(key, rowData[key]);
      });
      await existingRow.save();
    } else {
      // Adicionar novo
      console.log(`➕ Adicionando ${website} ao WebList...`);
      await webListSheet.addRow(rowData);
    }

    console.log(`✅ Análise salva no Google Sheets`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar no Sheets:', error);
    return false;
  }
}

// Funções auxiliares para cálculos
function calculatePricingForSheet(analysis, qScoreData) {
  // Simplificado
  let hours = 0;

  if (analysis.performanceMobile < 70) hours += 10;
  if (analysis.seo?.score < 70) hours += 8;
  if (analysis.security?.score < 70) hours += 6;
  if (analysis.accessibility?.score < 60) hours += 8;
  if ((analysis.pixelDetails?.totalTracking || 0) < 2) hours += 4;
  if (analysis.conversion?.score < 70) hours += 10;

  const total = Math.round(hours * 35); // €35/hora
  const timeline = Math.ceil(hours / 20); // 20h/semana

  return { total, timeline };
}

export async function updateLeadStatus(leadId, analysis) {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  // ✅ Otimizado: Buscar apenas a linha específica pelo offset (leadId - 2)
  // Row 2 is offset 0
  const offset = Math.max(0, leadId - 2);
  const rows = await sheet.getRows({ offset, limit: 1 });
  const row = rows[0];

  if (row) {
    row.set('Performance Score', analysis.performanceScore);
    row.set('Tem Pixel', analysis.hasPixel ? 'Sim' : 'Não');
    row.set('Tem CTA', analysis.hasCTA ? 'Sim' : 'Não');
    row.set('Status', 'analyzed');
    await row.save();
  }
}

export async function appendRowToSheet(spreadsheetId, sheetName, rowData) {
  try {
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();

    let sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      console.log(`📝 Aba "${sheetName}" não encontrada, tentando por índice 0...`);
      sheet = doc.sheetsByIndex[0];
    }

    // Lógica de UPSERT: Se houver uma coluna "ID", tenta encontrar a linha para atualizar
    const idKey = Object.keys(rowData).find(k => k.toLowerCase() === 'id');
    if (idKey && rowData[idKey]) {
      let existingRow = null;
      const CHUNK_SIZE_APPEND = 2000;
      let offsetAppend = 0;
      while (true) {
        const chunk = await sheet.getRows({ offset: offsetAppend, limit: CHUNK_SIZE_APPEND });
        if (chunk.length === 0) break;
        existingRow = chunk.find(r => r.get(idKey) == rowData[idKey]);
        if (existingRow || chunk.length < CHUNK_SIZE_APPEND) break;
        offsetAppend += CHUNK_SIZE_APPEND;
      }
      if (existingRow) {
        console.log(`🔄 Atualizando linha existente com ID: ${rowData[idKey]}`);
        Object.keys(rowData).forEach(key => {
          existingRow.set(key, rowData[key]);
        });
        await existingRow.save();
        return true;
      }
    }

    await sheet.addRow(rowData);
    console.log(`✅ Linha adicionada a ${spreadsheetId} / ${sheet.title}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao adicionar linha no Sheets:', error.message);
    throw error;
  }
}


