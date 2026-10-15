---
name: fix-pr-comments-and-learn
description: Traite les commentaires de revue ouverts sur une PR de l'utilisateur, puis met à jour les règles du repo pour que l'erreur ne se reproduise pas. Classe chaque commentaire (pertinent / non pertinent), vérifie les affirmations du relecteur contre le code avant d'accepter ou de contester, applique les corrections, répond dans chaque fil, résout les fils corrigés, et promeut les leçons dans `.claude/`. À utiliser quand l'utilisateur dit "traite les retours de la PR", "corrige les commentaires de review", "address PR feedback". Ne pas utiliser pour relire la PR de quelqu'un d'autre : c'est review-pr.
argument-hint: "[numéro ou URL de PR]"
---

# Traiter les retours d'une PR, et apprendre

Pendant de `review-pr` : celle-là relit les PR des autres, celle-ci traite les commentaires
**reçus** sur les nôtres. Un commentaire de relecteur est une hypothèse, pas un fait : on
vérifie dans le code avant d'appliquer ou de contester.

**PRÉREQUIS :** appliquer `preflight` (setup, sources, mode one-shot), exception : cette
skill tourne dans un repo de code, `preflight` y lit le `CLAUDE.md` du repo ; `writing-rules`
à toute rédaction s'il est joignable.

## Prérequis

| | |
|---|---|
| Racine | Le repo de code, sur la branche de la PR (jamais la branche par défaut) |
| Clés `CLAUDE.md` | Les commandes de vérification ; la carte « où vit chaque règle » si elle existe ; la skill de commit du repo s'il en a une |
| Sources à balayer | Les fils de revue ouverts de la PR ; `CLAUDE.md`, `.claude/rules/*.md`, les ADR ; le code visé par chaque commentaire |
| Connecteurs | `gh` authentifié |

## Étape 1 : la PR

- Numéro donné → `gh pr view <n>` ; lien → en extraire le numéro.
- Sans argument → `gh pr view --json number,title,body,baseRefName,headRefName` sur la
  branche courante. Pas de PR → le dire, et s'arrêter.

La branche locale doit être celle de la PR avant toute correction. Le dépôt se lit avec
`gh repo view --json nameWithOwner -q .nameWithOwner`.

## Étape 2 : les commentaires ouverts

En parallèle :

```bash
gh api repos/<owner>/<repo>/pulls/<n>/comments   # commentaires en ligne
gh api repos/<owner>/<repo>/pulls/<n>/reviews    # revues et leur corps
gh pr view <n> --json comments                   # commentaires généraux
```

Ne garder que les fils **non résolus**. L'état de résolution vit dans GraphQL :

```bash
gh api graphql -f query='query { repository(owner: "<owner>", name: "<repo>") {
  pullRequest(number: <n>) { reviewThreads(first: 100) { nodes {
    id isResolved isOutdated comments(first: 10) { nodes { id databaseId body path line author { login } } }
  } } } } }'
```

Écarter les fils `isResolved` et ceux qui ne contiennent que du bruit de robots (CI,
outils d'analyse).

## Étape 3 : classer et vérifier

Pour chaque commentaire : fichier et ligne, identifiant (pour répondre dans le fil),
nature (correction demandée, question, suggestion, détail), et **pertinence**.

**Pertinent** quand il :
- signale un bug, une règle d'architecture violée, un test manquant, un problème de
  sécurité ;
- propose une amélioration alignée sur les règles du repo ;
- corrige une incohérence factuelle.

**Non pertinent** quand il :
- contredit une convention établie du repo ;
- relève d'un choix de style que les règles ne couvrent pas ;
- est déjà traité ailleurs, ou obsolète ;
- repose sur une affirmation que la vérification dans le code infirme.

### Vérifier avant d'accepter ou de contester

« On a déjà un helper pour ça », « ce motif est interdit », « tous les autres font X » :
chercher dans le code avant d'agir. Un relecteur peut avoir raison sur le fond et tort sur
la prémisse ; la réponse honnête reconnaît le point et corrige le fait. Sans vérification,
deux échecs : refactorer sur une prémisse fausse, ou écarter une remarque valide sans
preuve.

Présenter le classement à l'utilisateur **avant** de toucher au code ; il retire ce qu'il
veut. Une question sans changement de code reçoit une réponse seulement.

## Étape 4 : corriger

Pour chaque commentaire pertinent, dans l'ordre des dépendances :

1. Le changement minimal qui répond au commentaire. Pas de refactoring d'opportunité.
2. Les règles du repo (`CLAUDE.md`, `.claude/rules/`).
3. Les commandes de vérification du `CLAUDE.md` : lint, typecheck, les tests du
   comportement touché.

Commiter avec la skill de commit du repo s'il en a une ; sinon un commit conventionnel
sur la branche de la PR.

## Étape 5 : répondre et résoudre

Répondre **dans le fil** de chaque commentaire traité : corrigé, répondu, ou décliné avec
la preuve vérifiée. Signature, détection des doublons, publication et résolution :
[references/reply-posting.md](references/reply-posting.md). Ne résoudre que les fils dont
la correction est appliquée et vérifiée.

## Étape 6 : apprendre

Pour chaque correction pertinente appliquée, la passe d'auto-amélioration de
[references/self-improvement.md](references/self-improvement.md) : une règle dans
`.claude/` aurait-elle évité l'erreur ? Si oui, l'écrire, généralisée, avec le pourquoi,
dans le bon fichier. Les commentaires non pertinents n'entrent pas dans ce cycle.

## Étape 7 : rendre la main

- Commentaires traités : corrigés / répondus / déclinés, avec les raisons.
- Commits créés, fils résolus.
- Règles ajoutées (fichier et règle), ou « aucune justifiée ».
- Réponses qui n'ont pas pu être postées, avec leur texte prêt à coller.
- Les sources balayées et celles écartées, avec la raison.

## Garde-fous

- Jamais de correction sur la branche par défaut.
- Un fil ne se résout que pour une correction appliquée et vérifiée ; questions et
  désaccords restent ouverts pour les humains.
- Ajouter une règle qui consigne un verdict de revue est de la documentation ; une règle
  qui **modifierait** une convention existante s'arrête et se demande.
