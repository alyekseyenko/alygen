CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  trace_id TEXT,
  lead_website TEXT,
  status TEXT DEFAULT 'queued',
  phase INTEGER DEFAULT 3,
  include_intel INTEGER DEFAULT 0,
  steps JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_website ON analysis_runs(lead_website);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_trace ON analysis_runs(trace_id);
