-- =====================================================================
-- Migration 06: Tables des paiements d'abonnements et webhooks D-FERME
-- =====================================================================

-- 1. Table abonnement_paiements
CREATE TABLE IF NOT EXISTS public.abonnement_paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gie_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
    niveau TEXT NOT NULL,
    montant NUMERIC(12,2) NOT NULL,
    devise TEXT DEFAULT 'XOF',
    provider TEXT NOT NULL,
    provider_reference TEXT,
    checkout_url TEXT,
    moyen_paiement TEXT DEFAULT 'wave',
    statut TEXT DEFAULT 'pending',
    doublon BOOLEAN DEFAULT false,
    abandonne_le TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.abonnement_paiements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture abonnements entreprise" ON public.abonnement_paiements;
DROP POLICY IF EXISTS "Insertion abonnements entreprise" ON public.abonnement_paiements;
DROP POLICY IF EXISTS "Modification abonnements entreprise" ON public.abonnement_paiements;

CREATE POLICY "Lecture abonnements entreprise" ON public.abonnement_paiements
    FOR SELECT TO authenticated
    USING (
      gie_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid())
      OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid())
    );

CREATE POLICY "Insertion abonnements entreprise" ON public.abonnement_paiements
    FOR INSERT TO authenticated
    WITH CHECK (
      gie_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid())
      OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid())
    );

CREATE POLICY "Modification abonnements entreprise" ON public.abonnement_paiements
    FOR UPDATE TO authenticated
    USING (
      gie_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid())
      OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid())
    )
    WITH CHECK (
      (gie_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid())
      OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()))
      AND statut <> 'completed'
    );

-- Index anti-doublon d'initiation
CREATE UNIQUE INDEX IF NOT EXISTS unq_abonnement_paiement_en_cours 
ON public.abonnement_paiements (gie_id) 
WHERE statut = 'pending' AND abandonne_le IS NULL;

-- 2. Table de dédoublonnage des webhooks
CREATE TABLE IF NOT EXISTS public.paiement_webhook_events (
    provider TEXT NOT NULL,
    event_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    PRIMARY KEY (provider, event_hash)
);

ALTER TABLE public.paiement_webhook_events ENABLE ROW LEVEL SECURITY;
