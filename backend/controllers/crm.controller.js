import { 
  getAlygenConfig, 
  saveAlygenConfig, 
  updateLeadCRMData 
} from '../services/supabase-service.js';

export const getCRMConfig = async (req, res) => {
  try {
    const result = await getAlygenConfig();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveCRMConfig = async (req, res) => {
  try {
    const result = await saveAlygenConfig(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLeadCRM = async (req, res) => {
  try {
    const { website, payload } = req.body;
    if (!website || !payload) {
      return res.status(400).json({ success: false, error: 'website e payload são obrigatórios' });
    }
    
    const result = await updateLeadCRMData(website, payload);
    
    if (result.success) {
      // ✅ NOTE: If you need to invalidate global cache, 
      // we'll need to pass a callback or use an event emitter in a more complex setup.
      // For now, we'll return the result and the router will handle the server-level side effect.
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
