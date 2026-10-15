# Auto-amélioration : promouvoir un retour de revue en règle

Pour chaque correction **pertinente** appliquée : une règle écrite aurait-elle évité
l'erreur ? Les commentaires non pertinents n'entrent pas dans ce cycle.

## Où va chaque leçon

Dans l'ordre :

1. Le fichier que la carte « où vit chaque règle » du `CLAUDE.md` du repo désigne, quand
   le repo en tient une.
2. Sinon la règle `.claude/rules/<sujet>.md` dont les `paths:` couvrent les fichiers
   concernés.
3. Une leçon sur le déroulement d'une skill (« faire X avant Y ») : le `SKILL.md` de cette
   skill.
4. Une lacune de la grille de relecture (on voudrait que `review-pr` l'attrape sur les
   PR des autres) : `.claude/skills/review-pr/references/reviewer.md`.
5. Une règle qui vaut pour toute session, sans fichier plus étroit : `CLAUDE.md`.

Aucune maison ne convient et la leçon est réellement partagée : s'arrêter et demander.
Un nouveau fichier de règle est un choix, pas un effet de bord.

C'est le même jeu de cibles que l'étape 7 de `review-pr` et que `promote-memory` : une
règle, une maison, aucun doublon.

## Garde-fou

Ajouter une règle qui **consigne** un verdict de revue est de la documentation. Une leçon
qui **modifierait** une convention existante (l'assouplir, la contredire) s'arrête et se
demande à l'utilisateur. Présenter les règles proposées avant de les écrire ; elles
partent dans la même PR que les corrections, sauf demande d'une PR dédiée.

## Comment écrire la règle

1. **Le pourquoi, pas seulement le quoi.** Une règle avec sa raison s'applique mieux qu'un
   ordre. Un « TOUJOURS » ou « JAMAIS » en capitales se reformule en explication.
2. **Généraliser.** Un commentaire est un point de donnée ; la règle couvre la classe
   d'erreurs, pas le cas.
3. **Rester maigre.** Pas de convention que Claude déduit du code. Seulement ce qui n'est
   pas évident, propre au projet, ou contraire aux défauts habituels.
4. **Un exemple concret**, avant / après, court. Sans date ni numéro de PR : une règle se
   lit hors du temps.
5. **La bonne altitude, la bonne maison.** Une règle de style ne va pas dans
   l'architecture ; une règle de test ne va pas dans les composants. Sans section
   adaptée, une petite sous-section nommée, jamais une annexe « leçons apprises ».
