-- =========================================================================================
-- MIGRATION 09 : SUIVI BUDGÉTAIRE AGRO-PASTORAL (PRÉVISIONS & RÉALISATIONS D-FERME)
-- Inclus à partir du niveau MÉDIUM
-- =========================================================================================

-- 1. Table des Budgets d'Exploitation
CREATE TABLE IF NOT EXISTS public.budgets_ferme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    exercice INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    periode_type VARCHAR(50) NOT NULL DEFAULT 'annuel', -- annuel, semestriel, trimestriel, mensuel, campagne
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    atelier VARCHAR(50) NOT NULL DEFAULT 'global', -- global, volaille, ruminants, lait, vegetal, porcin, autre
    statut VARCHAR(50) NOT NULL DEFAULT 'en_cours', -- brouillon, en_cours, cloture, archive
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    CONSTRAINT check_dates_budget CHECK (date_fin >= date_debut)
);

ALTER TABLE public.budgets_ferme ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Budgets par entreprise" ON public.budgets_ferme;
CREATE POLICY "Budgets par entreprise" ON public.budgets_ferme
    FOR ALL TO authenticated
    USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

-- 2. Table des Lignes de Prévision Budgétaire
CREATE TABLE IF NOT EXISTS public.lignes_budget_ferme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets_ferme(id) ON DELETE CASCADE,
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    type_flux VARCHAR(20) NOT NULL, -- charge (dépense), produit (recette), investissement (immobilisation)
    categorie VARCHAR(100) NOT NULL,
    compte_syscohada VARCHAR(20),
    libelle VARCHAR(255) NOT NULL,
    montant_prevu NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (montant_prevu >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.lignes_budget_ferme ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lignes budget par entreprise" ON public.lignes_budget_ferme;
CREATE POLICY "Lignes budget par entreprise" ON public.lignes_budget_ferme
    FOR ALL TO authenticated
    USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_budgets_ferme_ent_ex ON public.budgets_ferme(entreprise_id, exercice);
CREATE INDEX IF NOT EXISTS idx_budgets_ferme_dates ON public.budgets_ferme(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_lignes_budget_budget ON public.lignes_budget_ferme(budget_id);
CREATE INDEX IF NOT EXISTS idx_lignes_budget_compte ON public.lignes_budget_ferme(compte_syscohada);
