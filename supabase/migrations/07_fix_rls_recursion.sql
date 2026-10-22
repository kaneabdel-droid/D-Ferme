-- =====================================================================
-- Migration 07: Résolution de la récursion infinie RLS sur utilisateurs
-- =====================================================================

-- 1. Fonction SECURITY DEFINER pour récupérer l'entreprise de l'utilisateur connecté sans récursion
CREATE OR REPLACE FUNCTION public.get_auth_entreprise_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Recréation de la politique sur utilisateurs sans récursion
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Utilisateurs de la même entreprise" ON public.utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_self_and_colleagues" ON public.utilisateurs;

CREATE POLICY "utilisateurs_self_and_colleagues" ON public.utilisateurs
    FOR ALL TO authenticated
    USING (
        id = auth.uid() 
        OR entreprise_id = public.get_auth_entreprise_id()
    )
    WITH CHECK (
        id = auth.uid() 
        OR entreprise_id = public.get_auth_entreprise_id()
    );

-- 3. Politique sur entreprises
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Entreprise accessible par ses membres" ON public.entreprises;

CREATE POLICY "Entreprise accessible par ses membres" ON public.entreprises
    FOR ALL TO authenticated
    USING (
        id = public.get_auth_entreprise_id()
    );

-- 4. Politiques sur abonnement_paiements
ALTER TABLE public.abonnement_paiements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture abonnements entreprise" ON public.abonnement_paiements;
DROP POLICY IF EXISTS "Insertion abonnements entreprise" ON public.abonnement_paiements;
DROP POLICY IF EXISTS "Modification abonnements entreprise" ON public.abonnement_paiements;

CREATE POLICY "Lecture abonnements entreprise" ON public.abonnement_paiements
    FOR SELECT TO authenticated
    USING (
      gie_id = public.get_auth_entreprise_id()
      OR entreprise_id = public.get_auth_entreprise_id()
    );

CREATE POLICY "Insertion abonnements entreprise" ON public.abonnement_paiements
    FOR INSERT TO authenticated
    WITH CHECK (
      gie_id = public.get_auth_entreprise_id()
      OR entreprise_id = public.get_auth_entreprise_id()
    );

CREATE POLICY "Modification abonnements entreprise" ON public.abonnement_paiements
    FOR UPDATE TO authenticated
    USING (
      gie_id = public.get_auth_entreprise_id()
      OR entreprise_id = public.get_auth_entreprise_id()
    )
    WITH CHECK (
      (gie_id = public.get_auth_entreprise_id()
      OR entreprise_id = public.get_auth_entreprise_id())
      AND statut <> 'completed'
    );
