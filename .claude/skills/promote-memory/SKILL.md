---
name: promote-memory
description: Relit la mémoire personnelle de Claude pour un repo et promeut les apprentissages partagés dans les fichiers versionnés (`CLAUDE.md`, `.claude/rules/*.md`, `.claude/skills/<nom>/SKILL.md`), en laissant les préférences personnelles en mémoire. S'arrête pour approbation avant toute modification. À lancer périodiquement, après une rétro, ou quand le `MEMORY.md` personnel dépasse une cinquantaine d'entrées. Ne pas lancer pour une correction isolée : elle reste en mémoire tant qu'elle ne se répète pas.
disable-model-invocation: true
argument-hint: "[--dry-run]"
---

# Promouvoir la mémoire

La mémoire personnelle accumule deux choses : du **personnel** (rôle, préférences de
communication, particularités de la machine) et du **partagé** (conventions, nommage,
pièges, anti-motifs utiles à tout coéquipier). L'auto-mémoire capture les deux sans
distinction. Cette skill est la boucle de promotion : parcourir la mémoire, proposer une
maison versionnée pour chaque entrée partagée, et ouvrir une PR.

Une entrée promue atterrit dans un fichier existant, jamais dans une nouvelle réserve de
mémoire.

**PRÉREQUIS :** appliquer `preflight` (setup, sources, mode one-shot), exception : cette
skill tourne dans un repo de code, `preflight` y lit le `CLAUDE.md` du repo ; `writing-rules`
à toute rédaction s'il est joignable.

## Prérequis

| | |
|---|---|
| Racine | Le repo dont on promeut la mémoire |
| Clés `CLAUDE.md` | La carte « où vit chaque règle » si elle existe ; la skill de commit du repo s'il en a une |
| Sources à balayer | Le dossier de mémoire personnelle du repo (le chemin que le contexte de session donne ; ne jamais le supposer) ; `CLAUDE.md`, `AGENTS.md`, `.claude/rules/*.md`, `.claude/skills/*/SKILL.md`, `docs/` |
| Connecteurs | aucun |

## Étape 1 : inventaire

1. Lister chaque `*.md` du dossier de mémoire (sauf `MEMORY.md`, qui est l'index).
2. Lire chacun en entier. Regrouper par sujet pour repérer les quasi-doublons et les
   séries.
3. Lire `CLAUDE.md` et chaque fichier versionné de la liste ci-dessus.
4. Construire la carte `sujet → fichier(s) cible candidat(s)` avec les règles de routage.

## Étape 2 : classer

Une classification par entrée :

| Classification | Sens | Action |
|---|---|---|
| `PROMOUVOIR` | Partagé, absent des fichiers versionnés (ou à peine mentionné) | Proposer l'insertion dans le fichier cible |
| `ENRICHIR` | Déjà présent en partie ; l'entrée apporte une règle plus nette, un pourquoi, un contre-exemple | Proposer une petite retouche de la section |
| `DOUBLON` | Entièrement couvert par un fichier versionné | Proposer la suppression de la mémoire seulement |
| `GARDER` | Préférence personnelle, rôle, machine, style de communication | Rien |
| `INCERTAIN` | Personnel ou partagé, impossible à dire | Demander. Ne pas supposer |

Heuristiques :

- Convention de code, nommage, anti-motif, piège d'un framework → `PROMOUVOIR` ou
  `ENRICHIR`, presque toujours.
- Commande d'outillage, fait sur la structure du repo → `PROMOUVOIR` dans `CLAUDE.md`.
- « Faire X avant Y », « ne pas lancer Z » lié à un déroulement → le `SKILL.md` de la
  skill concernée.
- « Je préfère des réponses courtes », « ne résume pas » → `GARDER`.
- Tout ce qui commence par « l'utilisateur est… » → `GARDER`.

Routage, dans l'ordre :

1. La carte « où vit chaque règle » du `CLAUDE.md`, si le repo en tient une.
2. La règle `.claude/rules/<sujet>.md` dont les `paths:` couvrent les fichiers concernés.
3. Le `SKILL.md` de la skill dont le déroulement est concerné.
4. `CLAUDE.md`, seulement pour ce qui vaut à chaque session et n'a pas de maison plus
   étroite.

Rien ne convient et l'entrée est réellement partagée : **s'arrêter et demander**. La
bonne réponse est souvent un nouveau fichier de règle ou une nouvelle section, et c'est un
choix de l'utilisateur.

## Étape 3 : rapport, puis attendre

Un seul rapport :

```
[CLASSIFICATION] <fichier de mémoire>
  Essence : <une ligne>
  Cible   : <chemin/fichier.md> (ou « s.o. » pour GARDER / DOUBLON)
  Patch   : <insertion ou retouche proposée, en diff ou en extrait>
  Raison  : <pourquoi cette classification ; citer la ligne de la cible pour ENRICHIR / DOUBLON>
```

Groupé par classification ; dans chaque groupe, le plus utile d'abord (règles enfreintes
récemment, puis pièges occasionnels, puis préférences). Une ligne finale :
`N promouvoir, N enrichir, N doublon, N garder, N incertain`.

**S'arrêter.** Attendre l'approbation explicite par entrée ou par lot. Avec `--dry-run`,
la skill s'arrête ici.

## Étape 4 : appliquer ce qui est approuvé

1. `PROMOUVOIR` / `ENRICHIR` : modifier le fichier cible avec `Edit`, dans sa forme
   (puces, lignes de tableau, prose courte ; jamais une forme nouvelle). Supprimer le
   fichier de mémoire et sa ligne dans `MEMORY.md`.
2. `DOUBLON` : supprimer le fichier de mémoire et sa ligne. Aucune modification du repo.
3. `GARDER` : rien.

Puis : commiter avec la skill de commit du repo (sinon un commit conventionnel
`chore(claude): promote N memory entries`), et ouvrir une PR dont le corps est le rapport
de l'étape 3 sans les entrées `GARDER`.

## Étape 5 : rendre la main

Les entrées promues, enrichies, supprimées ; la PR ; ce qui reste `INCERTAIN`. Les sources
balayées et celles écartées, avec la raison.

## Garde-fous

- **Jamais de suppression silencieuse** : l'utilisateur voit ce qui est retiré, promu ou
  doublon.
- **Jamais de convention inventée** : si l'entrée dit « X est la règle » et que le code
  contredit X, `INCERTAIN`.
- **Jamais de doublon** : présent mot pour mot dans la cible = `DOUBLON`, pas `ENRICHIR`.
- **Jamais de nouveau fichier de premier niveau** sans décision de l'utilisateur.
- **Une PR par promotion.** Pas de promotion mêlée à un autre travail.
- Ne pas promouvoir une correction isolée sans récurrence, ni une préférence de
  communication, ni dans `CLAUDE.md` ce qu'une règle plus étroite couvre déjà.
