import express from 'express';
import { 
  getSequences, 
  pauseSequence,
  stopSequence,
  repliedSequence,
  bulkPauseSequences,
  bulkCancelSequences,
  bulkRepliedSequences,
  listAutomations,
  saveAutomation,
  removeAutomation,
  listAutomationLogs,
  testAutomation
} from '../controllers/automations.controller.js';

const router = express.Router();

// Sequences
router.get('/sequences', getSequences);
router.patch('/sequences/:id/pause', pauseSequence);
router.patch('/sequences/:id/cancel', stopSequence);
router.patch('/sequences/:id/replied', repliedSequence);
router.patch('/sequences/bulk/pause', bulkPauseSequences);
router.patch('/sequences/bulk/cancel', bulkCancelSequences);
router.patch('/sequences/bulk/replied', bulkRepliedSequences);

// Automations
router.get('/automations', listAutomations);
router.post('/automations', saveAutomation);
router.delete('/automations/:id', removeAutomation);
router.get('/automations/:id/logs', listAutomationLogs);
router.post('/automations/test', testAutomation);

export default router;
