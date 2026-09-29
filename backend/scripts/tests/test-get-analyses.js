import { getAllAnalyses } from './services/crm-data-service.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing getAllAnalyses...');
getAllAnalyses({}).then(r => console.log('Result:', JSON.stringify(r))).catch(e => console.error('Error:', e));
