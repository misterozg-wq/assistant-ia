// =====================================================================
//  RÉGLAGES PAR PARTENAIRE / COMPAGNIE  — GPC Remplissage
// ---------------------------------------------------------------------
//  Sans réglage, l'extension reconnaît seule les cases (libellés, noms
//  des champs…). Ici on force, pour un site donné, quelle case reçoit
//  quelle donnée de la fiche, quand la reconnaissance automatique ne
//  suffit pas.
//
//  Format :
//   'domaine.fr': {
//      nom: 'Nom du partenaire',
//      champs: { 'sélecteur CSS de la case': 'cléFiche', ... },
//      dates: 'jj/mm/aaaa'   // format des dates tapées (facultatif)
//   }
//
//  Clés de fiche disponibles : civilite, nom, prenom, nomComplet,
//  dateNaissance, lieuNaissance, profession, situationFamiliale,
//  adresse, cp, ville, adresseComplete, tel, email, siret, naf, activite,
//  dateCreation, iban, bic, datePermis, bonusMalus, moisAssure36,
//  sinistres36, vehMarque, vehModele, vehEnergie, vehCarrosserie, vehCV,
//  vehImmat, vehMEC, vehDateAchat, vehFinancement, vehUsage, vehKm,
//  vehStationnement, vehCPGarage, formuleSouhaitee, dateEffetSouhaitee
//
//  Les cases « apprises » depuis l'extension (bouton Apprendre une case)
//  sont enregistrées dans Chrome et s'ajoutent à ces réglages.
// =====================================================================
window.GPC_SITES = {
  // Exemple (à compléter avec les paramétrages des partenaires) :
  // 'courtier.tetris-assurance.com': {
  //   nom: 'Tetris',
  //   champs: { '#lastname': 'nom', '#firstname': 'prenom' },
  //   dates: 'jj/mm/aaaa'
  // },
};
