Finalise une application SPBB de gestion des inscriptions en SvelteKit 2 + Svelte 5 + Supabase.

Contraintes strictes :
- Svelte 5 avec Runes
- SvelteKit 2
- JavaScript vanilla uniquement
- Supabase pour auth, DB, storage, sécurité
- pas de Tailwind
- CSS classique en BEM
- code complet de chaque fichier
- actions sensibles uniquement via serveur SvelteKit
- RPC admin jamais appelés directement depuis le client

Contexte métier :
- saison 2026-2027
- rôles : member, admin
- types de licence :
  - Joueur/Joueuse
  - Entraîneur/Entraîneuse
  - Dirigeant/Dirigeante
  - Parent accompagnateur
- montant licence : 150 €
- documents requis selon type de licence
- paiement FFBB ou paiement manuel club
- échéancier possible 1 à 3 fois
- workflow FFBB suivi par admin
- messagerie interne licencié/admin

Supabase :
- tables métier déjà créées
- bucket storage : documents-licences
- convention fichier :
  - {registration_id}/{document_type_code}_{uuid}.pdf

RPC admin à utiliser :
- send_ffbb_link(p_registration_id uuid)
- validate_document(p_document_id uuid, p_note text default null)
- reject_document(p_document_id uuid, p_note text default null)
- mark_ffbb_payment_confirmed(p_registration_id uuid)
- mark_ffbb_registration_completed(p_registration_id uuid)
- record_manual_payment(...)

À produire :
1. architecture de fichiers proposée
2. pages auth
3. page formulaire inscription
4. page mon dossier
5. upload sécurisé documents
6. messagerie interne
7. page admin liste licenciés
8. page admin fiche licencié
9. branchement RPC admin via +page.server.js
10. composants réutilisables
11. README.md mis à jour

Critères :
- code complet
- pas de pseudo-code
- interface propre et responsive
- sécurité respectée
- requêtes Supabase correctes
- architecture claire
- respect strict de Svelte 5 / SvelteKit 2