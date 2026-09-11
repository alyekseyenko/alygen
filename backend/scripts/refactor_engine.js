import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const enginePath = path.join(__dirname, '..', 'services', 'automation-engine.js');

let code = fs.readFileSync(enginePath, 'utf8');

const actionStartStr = "        case 'action':\\n            if (node.actionType === 'send_email') {";
const actionEndStr = "            return { status: 'continue' };\\n\\n        case 'wait':";

const idxStart = code.indexOf("        case 'action':\n            if (node.actionType === 'send_email') {");
const idxEnd = code.indexOf("            return { status: 'continue' };\n\n        case 'wait':");

if (idxStart === -1 || idxEnd === -1) {
    console.error("Indices not found! Extraction failed.");
    console.error("Start index:", idxStart);
    console.error("End index:", idxEnd);
    process.exit(1);
}

// Extract the raw action block (lines 291 to 749ish)
const rawActionCode = code.substring(idxStart + 23, idxEnd + 42); // from the start of the ifs to the return { status: 'continue' };

// We will build `actions-core.js` which exports an `executeAction` function.
const newHandlerCode = `
// Estratégia de Ações Modular do Motor de Automações
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export async function executeAction(node, context, isDryRun, automation, renderTemplate) {
    const { lead, analysis } = context;
    // Tentar importar de handlers modulares novos primeiro
    try {
        const { ActionRegistry } = await import('./action-handlers.js');
        if (ActionRegistry[node.actionType]) {
            return await ActionRegistry[node.actionType]({ node, context, isDryRun, automation, renderTemplate });
        }
    } catch (e) {
        console.warn('ActionRegistry fallback:', e.message);
    }

${rawActionCode}

    console.log(\`⚠️ Action type não reconhecido no core: \${node.actionType}\`);
    return { status: 'continue' };
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'services', 'automation', 'actions-core.js'), newHandlerCode.trim() + '\n');

// Replace the giant block in `automation-engine.js` with the dynamic call
const replacementStr = `        case 'action':
            const { executeAction } = await import('./automation/actions-core.js');
            return await executeAction(node, context, isDryRun, automation, renderTemplate);
            
        case 'wait':`;

const newCode = code.substring(0, idxStart) + replacementStr + code.substring(idxEnd + 55);

fs.writeFileSync(enginePath, newCode);
console.log('✅ Extraction complete. automation-engine.js refactored.');
