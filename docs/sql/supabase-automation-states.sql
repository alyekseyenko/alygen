-- Tabela para guardar o estado das automações em pausa (Waits e Approvals)
-- Isto garante que se o servidor reiniciar, as automações retomam onde pararam.

CREATE TABLE IF NOT EXISTS public.automation_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    current_node_id TEXT NOT NULL,
    context JSONB DEFAULT '{}', -- Guarda variáveis da lead, qScore, etc.
    resume_at TIMESTAMPTZ NOT NULL, -- Data e hora para acordar o nó
    status TEXT DEFAULT 'pending', -- pending, processing, completed
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index para o worker procurar rápido quem está pronto a acordar
CREATE INDEX IF NOT EXISTS idx_automation_resume ON public.automation_states (resume_at) WHERE status = 'pending';

-- Habilitar Realtime (opcional mas bom para debugging)
ALTER PUBLICATION supabase_realtime ADD TABLE automation_states;
