-- =========================================================================================
-- MIGRATION 10 : CONDITIONNEMENT SACHET & SAISIE DES ACHATS D'ARTICLES
-- =========================================================================================

-- 1. Ajout de la colonne conditionnement sur les intrants / articles
ALTER TABLE public.intrants
  ADD COLUMN IF NOT EXISTS conditionnement TEXT DEFAULT 'sachet';

-- 2. Ajout de la liaison intrant_id sur les finances d'élevage pour relier les achats aux articles
ALTER TABLE public.finances_elevage
  ADD COLUMN IF NOT EXISTS intrant_id UUID REFERENCES public.intrants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finances_elevage_intrant ON public.finances_elevage(intrant_id);

-- 3. Mise à jour des intrants existants pour définir conditionnement d'après l'unité
UPDATE public.intrants
SET conditionnement = CASE
  WHEN unite = 'sachet' THEN 'sachet'
  WHEN unite = 'sac_50kg' THEN 'sac_50kg'
  WHEN unite = 'sac' THEN 'sac'
  WHEN unite = 'flacon' THEN 'flacon'
  WHEN unite = 'dose' THEN 'dose'
  WHEN unite = 'litre' THEN 'litre'
  WHEN unite = 'boite' THEN 'boite'
  ELSE COALESCE(conditionnement, unite, 'sachet')
END
WHERE conditionnement IS NULL;

