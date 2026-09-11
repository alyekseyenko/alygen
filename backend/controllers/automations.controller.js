import { 
  listSequences, 
  togglePause, 
  cancelSequence, 
  markRepliedById, 
  bulkPause, 
  bulkCancel, 
  bulkMarkReplied 
} from '../services/email-sequences.js';

import { 
  getAutomations, 
  upsertAutomation, 
  deleteAutomation, 
  getAutomationLogs,
  getAllAnalyses
} from '../services/supabase-service.js';

// --- SEQUENCES ---
export const getSequences = async (req, res) => {
  try {
    const pausedParam = req.query.paused;
    const paused =
      pausedParam === 'true' ? true :
      pausedParam === 'false' ? false :
      undefined;

    const result = await listSequences({
      filter: req.query.filter || 'all',
      status: req.query.status,
      template: req.query.template,
      paused,
      q: req.query.q,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const pauseSequence = async (req, res) => {
  try {
    const result = await togglePause(req.params.id, req.body.paused);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const stopSequence = async (req, res) => {
  try {
    const result = await cancelSequence(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const repliedSequence = async (req, res) => {
  try {
    const result = await markRepliedById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkPauseSequences = async (req, res) => {
  try {
    const result = await bulkPause(req.body.ids || [], req.body.paused);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkCancelSequences = async (req, res) => {
  try {
    const result = await bulkCancel(req.body.ids || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkRepliedSequences = async (req, res) => {
  try {
    const result = await bulkMarkReplied(req.body.ids || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- AUTOMATIONS ---
export const listAutomations = async (req, res) => {
  const result = await getAutomations();
  res.status(result.success ? 200 : 500).json(result);
};

export const saveAutomation = async (req, res) => {
  const result = await upsertAutomation(req.body);
  res.status(result.success ? 200 : 500).json(result);
};

export const removeAutomation = async (req, res) => {
  const result = await deleteAutomation(req.params.id);
  res.status(result.success ? 200 : 500).json(result);
};

export const listAutomationLogs = async (req, res) => {
  const result = await getAutomationLogs(req.params.id);
  res.status(result.success ? 200 : 500).json(result);
};

export const testAutomation = async (req, res) => {
  const { workflow } = req.body;
  if (!workflow || !workflow.nodes) return res.status(400).json({ success: false, error: 'Workflow data is missing' });

  const testAnalyses = await getAllAnalyses();
  if (!testAnalyses.success || testAnalyses.data.length === 0) {
    return res.status(404).json({ success: false, error: 'No recent leads available to test. Please analyze a lead first.' });
  }

  // Pegar a análise mais recente como cobaia
  const testAnalysis = testAnalyses.data[0];
  const testLead = { 
    id: 'test-lead-123', 
    name: testAnalysis.name || 'Empresa Teste', 
    website: testAnalysis.website,
    email: testAnalysis.extractedEmails?.[0] || 'teste@example.com' 
  };
  
  const dummyAutomation = {
    id: 'test-execution',
    name: 'Test Workflow',
    workflow_data: workflow
  };

  const { executeWorkflow } = await import('../services/automation-engine.js');
  
  let testLogs = [];
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    testLogs.push(args.join(' '));
    originalConsoleLog(...args);
  };

  try {
    await executeWorkflow(dummyAutomation, testLead, testAnalysis, { dryRun: true });
  } catch(e) {
    testLogs.push('ERROR: ' + e.message);
  } finally {
    console.log = originalConsoleLog;
  }

  res.json({ success: true, logs: testLogs, lead: testLead });
};
