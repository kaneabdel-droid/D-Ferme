-- =========================================================================================
-- MIGRATION 08 : RÉFÉRENTIELS ÉLEVAGE/VÉGÉTAL & COMPTABILITÉ SYSCOHADA AGRO-PASTORALE
-- =========================================================================================

-- 1. Espèces d'élevage personnalisables
ALTER TABLE public.especes_elevage
  ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE;

-- RLS sur especes_elevage
ALTER TABLE public.especes_elevage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture especes_elevage" ON public.especes_elevage;
CREATE POLICY "Lecture especes_elevage" ON public.especes_elevage
  FOR SELECT TO authenticated
  USING (entreprise_id IS NULL OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modification especes_elevage par entreprise" ON public.especes_elevage;
CREATE POLICY "Modification especes_elevage par entreprise" ON public.especes_elevage
  FOR ALL TO authenticated
  USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

-- 2. Table des Races d'élevage
CREATE TABLE IF NOT EXISTS public.races_elevage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
    espece_code TEXT,
    nom TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.races_elevage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture races_elevage" ON public.races_elevage;
CREATE POLICY "Lecture races_elevage" ON public.races_elevage
  FOR SELECT TO authenticated
  USING (entreprise_id IS NULL OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modification races_elevage par entreprise" ON public.races_elevage;
CREATE POLICY "Modification races_elevage par entreprise" ON public.races_elevage
  FOR ALL TO authenticated
  USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

-- Colonne race sur animaux et bandes
ALTER TABLE public.animaux ADD COLUMN IF NOT EXISTS race TEXT;
ALTER TABLE public.bandes ADD COLUMN IF NOT EXISTS race TEXT;

-- 3. Table des Spéculations Végétales
CREATE TABLE IF NOT EXISTS public.speculations_vegetales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    type_culture TEXT NOT NULL DEFAULT 'maraichere', -- maraichere, fruitiere, fourragere, cerealiere, legumineuse, autre
    variete_defaut TEXT,
    rendement_estime_ha NUMERIC(10,2),
    cycle_jours INTEGER,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.speculations_vegetales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture speculations_vegetales" ON public.speculations_vegetales;
CREATE POLICY "Lecture speculations_vegetales" ON public.speculations_vegetales
  FOR SELECT TO authenticated
  USING (entreprise_id IS NULL OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modification speculations_vegetales par entreprise" ON public.speculations_vegetales;
CREATE POLICY "Modification speculations_vegetales par entreprise" ON public.speculations_vegetales
  FOR ALL TO authenticated
  USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

-- 4. Table des Catégories d'Intrants
CREATE TABLE IF NOT EXISTS public.categories_intrants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    nom TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.categories_intrants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture categories_intrants" ON public.categories_intrants;
CREATE POLICY "Lecture categories_intrants" ON public.categories_intrants
  FOR SELECT TO authenticated
  USING (entreprise_id IS NULL OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modification categories_intrants par entreprise" ON public.categories_intrants;
CREATE POLICY "Modification categories_intrants par entreprise" ON public.categories_intrants
  FOR ALL TO authenticated
  USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

-- Déverrouiller la contrainte CHECK rigide sur intrants.categorie pour accepter toutes les catégories
ALTER TABLE public.intrants DROP CONSTRAINT IF EXISTS intrants_categorie_check;

-- 5. Plan Comptable SYSCOHADA pour l'Agro-pastoral (D-FERME)
CREATE TABLE IF NOT EXISTS public.plan_comptable_ferme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE, -- NULL = plan SYSCOHADA de référence
    compte VARCHAR(20) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    classe SMALLINT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- actif, passif, charge, produit
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.plan_comptable_ferme ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture plan_comptable_ferme" ON public.plan_comptable_ferme;
CREATE POLICY "Lecture plan_comptable_ferme" ON public.plan_comptable_ferme
  FOR SELECT TO authenticated
  USING (entreprise_id IS NULL OR entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modification plan_comptable_ferme par entreprise" ON public.plan_comptable_ferme;
CREATE POLICY "Modification plan_comptable_ferme par entreprise" ON public.plan_comptable_ferme
  FOR ALL TO authenticated
  USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

-- 6. Écritures Comptables & Journaux (Achats, Ventes, OD, Caisse, Banque, Mobile Money)
CREATE TABLE IF NOT EXISTS public.ecritures_comptables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    journal VARCHAR(50) NOT NULL DEFAULT 'ventes', -- achats, ventes, od, caisse, banque, mobile
    date_ecriture DATE NOT NULL DEFAULT CURRENT_DATE,
    numero_piece VARCHAR(100),
    libelle TEXT NOT NULL,
    validee BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.ecritures_comptables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ecritures entreprise" ON public.ecritures_comptables;
CREATE POLICY "Ecritures entreprise" ON public.ecritures_comptables
  FOR ALL TO authenticated
  USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

-- 7. Lignes d'Écritures Comptables (Partie double)
CREATE TABLE IF NOT EXISTS public.lignes_ecritures_comptables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ecriture_id UUID NOT NULL REFERENCES public.ecritures_comptables(id) ON DELETE CASCADE,
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    compte VARCHAR(20) NOT NULL,
    libelle TEXT,
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

ALTER TABLE public.lignes_ecritures_comptables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lignes ecritures entreprise" ON public.lignes_ecritures_comptables;
CREATE POLICY "Lignes ecritures entreprise" ON public.lignes_ecritures_comptables
  FOR ALL TO authenticated
  USING (entreprise_id IN (SELECT entreprise_id FROM public.utilisateurs WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_ecritures_ferme_date ON public.ecritures_comptables(entreprise_id, date_ecriture);
CREATE INDEX IF NOT EXISTS idx_ecritures_ferme_journal ON public.ecritures_comptables(entreprise_id, journal);
CREATE INDEX IF NOT EXISTS idx_lignes_ferme_compte ON public.lignes_ecritures_comptables(entreprise_id, compte);
CREATE INDEX IF NOT EXISTS idx_lignes_ferme_ecriture ON public.lignes_ecritures_comptables(ecriture_id);

-- 8. Données de référence par défaut : Races, Spéculations, Catégories, Plan Comptable
INSERT INTO public.races_elevage (nom, espece_code, description, entreprise_id) VALUES
('Gobra', 'bovin_viande', 'Race zébu sahélienne rustique très résistante à la sécheresse', NULL),
('Montbéliarde', 'bovin_lait', 'Excellente race laitière adaptée aux croisements améliorateurs', NULL),
('Holstein / Frisonne', 'bovin_lait', 'Race laitière à très haut potentiel de production', NULL),
('Peul / Goudali', 'bovin_viande', 'Zébu sahélien de boucherie et traction', NULL),
('Ladoum', 'ovin_caprin', 'Mouton d''élite sahélien de prestige à très forte valeur marchande', NULL),
('Touabire', 'ovin_caprin', 'Mouton maure blanc de grande taille pour tabaski et reproduction', NULL),
('Peul-Peul', 'ovin_caprin', 'Mouton sahélien rustique à viande', NULL),
('Chèvre du Sahel', 'ovin_caprin', 'Caprin rustique très prolifique', NULL),
('Cobb 500', 'volaille_chair', 'Poulet de chair à croissance très rapide et fort rendement filet', NULL),
('Ross 308', 'volaille_chair', 'Poulet de chair polyvalent résistant au stress thermique', NULL),
('Goliath', 'volaille_chair', 'Race améliorée locale géante à chair ferme et savoureuse', NULL),
('Isa Brown', 'volaille_ponte', 'Pondeuse rousse numéro 1 mondiale en ponte d''œufs bruns', NULL),
('Large White', 'porcin', 'Race porcine charcutière à forte prolificité', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.speculations_vegetales (nom, type_culture, variete_defaut, rendement_estime_ha, cycle_jours, entreprise_id) VALUES
('Tomate', 'maraichere', 'Mongal F1 / Cobra', 25.0, 75, NULL),
('Oignon', 'maraichere', 'Violet de Galmi / Safari', 30.0, 110, NULL),
('Piment', 'maraichere', 'Antillais / Habanero', 12.0, 90, NULL),
('Gombo', 'maraichere', 'Clemson Spineless', 8.0, 55, NULL),
('Maïs doux / Céréalier', 'cerealiere', 'TZEE / Synthetique', 4.5, 90, NULL),
('Arachide', 'legumineuse', '55-437 / Fleur 11', 2.0, 90, NULL),
('Manioc', 'maraichere', 'Kombo / TMS', 25.0, 240, NULL),
('Pastèque', 'fruitiere', 'Kaolack / Sugar Baby', 20.0, 75, NULL),
('Aubergine amère (Diakhatou)', 'maraichere', 'Ngalam', 15.0, 80, NULL),
('Papaye', 'fruitiere', 'Solo / Red Lady F1', 35.0, 270, NULL),
('Fourrage / Luzerne / Maralfalfa', 'fourragere', 'Maralfalfa / Panicum', 50.0, 45, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.categories_intrants (code, nom, description, entreprise_id) VALUES
('aliment', 'Aliments & Provendes', 'Aliments concentrés, maïs concassé, tourteaux, son de blé', NULL),
('medicament', 'Médicaments & Antibiotiques', 'Traitements curatifs, antibiotiques, antiparasitaires', NULL),
('vaccin', 'Vaccins & Sérologie', 'Vaccins aviaires, pestes des petits ruminants, charbon', NULL),
('vitamines', 'Vitamines & Minéraux (CMV)', 'Compléments minéraux et vitaminés, blocs à lécher', NULL),
('engrais', 'Engrais & Fertilisants', 'Engrais NPK, urée, fumier organique composté', NULL),
('semence', 'Semences & Plants', 'Semences certifiées, rejets de manioc, graines maraîchères', NULL),
('phytosanitaire', 'Produits Phytosanitaires', 'Insecticides, fongicides, bio-pesticides de protection', NULL),
('litiere', 'Litière & Paille', 'Copeaux de bois, paille d''arachide, foin', NULL),
('desinfectant', 'Désinfectants & Hygiène', 'Chaux vive, crésyl, virucides pour pédiluves et bâtiments', NULL),
('materiel', 'Petit Matériel & Consommables', 'Abreuvoirs, mangeoires, seringues, boucles, emballages', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.plan_comptable_ferme (compte, libelle, classe, type, entreprise_id) VALUES
('101', 'Capital social / Apport personnel d''exploitation', 1, 'passif', NULL),
('162', 'Emprunts bancaires & crédits de campagne agricole', 1, 'passif', NULL),
('211', 'Terrains agricoles & Parcelles en propriété', 2, 'actif', NULL),
('213', 'Bâtiments (Poulaillers, étables, bergeries, hangars)', 2, 'actif', NULL),
('215', 'Matériel agricole, abreuvoirs, clôtures & tracteurs', 2, 'actif', NULL),
('241', 'Cheptel reproducteur immobilisé (Génisses, Béliers, Truies)', 2, 'actif', NULL),
('311', 'Stocks d''intrants (Aliments bétail, provendes, semences, engrais)', 3, 'actif', NULL),
('312', 'Stocks de produits vétérinaires, vaccins & soins', 3, 'actif', NULL),
('321', 'Stocks de récoltes végétales, foin & fourrages stockés', 3, 'actif', NULL),
('341', 'Animaux en élevage & engraissement (Bandes, Volailles, Porcs)', 3, 'actif', NULL),
('401', 'Fournisseurs d''intrants, vétérinaires & provendiers', 4, 'passif', NULL),
('411', 'Clients (Boucheries, laiteries, grossistes, particuliers)', 4, 'actif', NULL),
('421', 'Personnel ouvrier agricole & bergers', 4, 'passif', NULL),
('431', 'Sécurité sociale & caisses de prévoyance agricole', 4, 'passif', NULL),
('441', 'État - Impôts & Taxes d''exploitation', 4, 'passif', NULL),
('521', 'Banque d''exploitation de la ferme', 5, 'actif', NULL),
('531', 'Caisse principale en espèces (Exploitation)', 5, 'actif', NULL),
('571', 'Comptes Mobile Money (Wave, Orange Money)', 5, 'actif', NULL),
('601', 'Achats d''animaux & poussins d''un jour', 6, 'charge', NULL),
('602', 'Achats d''aliments de bétail, provendes & tourteaux', 6, 'charge', NULL),
('604', 'Achats de semences, engrais & produits phytosanitaires', 6, 'charge', NULL),
('608', 'Produits vétérinaires, vaccins & soins sanitaires', 6, 'charge', NULL),
('605', 'Carburant tracteurs, électricité & eau d''irrigation', 6, 'charge', NULL),
('613', 'Locations de terres, fermages & baux ruraux', 6, 'charge', NULL),
('624', 'Transports d''animaux, livraisons de récoltes & intrants', 6, 'charge', NULL),
('631', 'Rémunérations du personnel & main d''oeuvre saisonnière', 6, 'charge', NULL),
('681', 'Dotations aux amortissements (Bâtiments & Matériel agricole)', 6, 'charge', NULL),
('701', 'Ventes d''animaux vifs (Bovins, béliers, poulets de chair, porcs)', 7, 'produit', NULL),
('702', 'Ventes de lait frais & produits laitiers fermiers', 7, 'produit', NULL),
('703', 'Ventes d''œufs de table & d''incubation', 7, 'produit', NULL),
('704', 'Ventes de récoltes végétales maraîchères & céréalières', 7, 'produit', NULL),
('705', 'Ventes de fourrages, foin & litières recyclées', 7, 'produit', NULL),
('706', 'Prestations agricoles, saillies & locations de matériel', 7, 'produit', NULL)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
