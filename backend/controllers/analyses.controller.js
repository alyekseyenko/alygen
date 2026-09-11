import { 
  getAllAnalyses, 
  getAnalyticsStats, 
  getAnalysisFromSupabase 
} from '../services/supabase-service.js';

export const listAnalyses = async (req, res) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      search: req.query.search || undefined,
      minQScore: req.query.minQScore ? parseInt(req.query.minQScore) : undefined,
      maxQScore: req.query.maxQScore ? parseInt(req.query.maxQScore) : undefined,
      priority: req.query.priority,
      hasSSL: req.query.hasSSL === 'true' ? true : req.query.hasSSL === 'false' ? false : undefined,
      is_immune: req.query.is_immune === 'true' ? true : req.query.is_immune === 'false' ? false : undefined
    };
    
    const result = await getAllAnalyses(filters);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.count,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const result = await getAnalyticsStats();
    
    if (result.success) {
      res.json({ success: true, stats: result.stats });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAnalysisByWebsite = async (req, res) => {
  try {
    const website = decodeURIComponent(req.params.website);
    const result = await getAnalysisFromSupabase(website);
    
    if (result.success) {
      const analysisData = result.data;
      if (!analysisData.emailTemplate || !analysisData.emailTemplate.html) {
        console.log(`⚡ [Self-Healing] Generating missing emailTemplate for ${website}...`);
        try {
          const { generateEmailTemplate } = await import('../services/email-template.js');
          const { saveAnalysisToSupabase } = await import('../services/supabase-service.js');
          const leadData = analysisData.leadData || { name: analysisData.company_name || website, website: website };
          const emailTemplate = await generateEmailTemplate(analysisData, leadData);
          analysisData.emailTemplate = emailTemplate;
          await saveAnalysisToSupabase(website, analysisData, leadData);
          console.log(`✅ [Self-Healing] emailTemplate successfully saved to DB for ${website}`);
        } catch (genErr) {
          console.error(`❌ [Self-Healing] Failed to generate missing email template:`, genErr);
        }
      }
      res.json({ success: true, data: analysisData, cachedAt: result.cachedAt });
    } else {
      res.status(404).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
