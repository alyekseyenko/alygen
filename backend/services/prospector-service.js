import axios from 'axios';
import { getPythonFastApiUrl } from '../config/python-url.js';
import { pythonAuthHeaders } from './python-bridge.js';
import { updateLeadCRMData } from './crm-data-service.js';
import { enqueueAudit } from './job-queue.js';

const PYTHON_URL = getPythonFastApiUrl();

export async function runProspectorCampaign({
  sector,
  city,
  provider = 'serpapi_maps',
  minRating = 0,
  minReviews = 0,
}) {
  const { data } = await axios.post(
    `${PYTHON_URL}/prospector/campaign`,
    { sector, city, provider, min_rating: minRating, min_reviews: minReviews },
    { timeout: 120_000, headers: pythonAuthHeaders() }
  );
  if (!data?.success) {
    return data;
  }

  let enqueued = 0;
  for (const lead of data.leads || []) {
    const website = lead.website || `no-website-${lead.place_id || lead.title}`;
    await updateLeadCRMData(website, {
      name: lead.title,
      client_phone: lead.phone,
      client_address: lead.address,
      rating: lead.rating,
      reviews_count: lead.reviews,
    });
    if (!lead.skip_audit && website) {
      const jobId = await enqueueAudit({ url: website, leadData: { name: lead.title, city, type: sector } });
      if (jobId) enqueued += 1;
    }
  }

  return { ...data, audits_enqueued: enqueued };
}
