---
name: define-artefact
description: Pour un type d'objet qu'un repo de code crée souvent (un composant, un store, un finder, un prototype, un script), écrit la paire règle + scaffold : `.claude/rules/<artefact>.md`, chargée automatiquement quand on édite un fichier qui correspond à ses `paths:`, et `.claude/skills/create-<artefact>/SKILL.md`, qui crée un nouvel exemplaire en la respectant. Les conventions sont tirées d'exemples existants dans le code, jamais inventées. À utiliser quand l'utilisateur dit "définis les conventions des X", "fais une règle pour les X", "je veux un create-X", ou quand une skill de scaffold existe sans règle (ou l'inverse). Ne pas utiliser pour une règle transverse sans type de fichier : elle va dans CLAUDE.md.
argument-hint: "<artefact> [globs des fichiers concernés]"
---

# Définir un artefact : sa règle et son scaffold

Un repo qui crée souvent le même type d'objet gagne à l'écrire une fois, en deux fichiers
couplés : la **règle**, qui dit ce qu'un bon exemplaire respecte et pourquoi, chargée par
Claude Code seulement quand on touche un fichier concerné ; et le **scaffold**, la skill
`create-<artefact>` qui en crée un nouveau dans le bon dossier, au bon nom, avec la liste
de vérification de la règle. La règle porte le quoi ; la skill porte le comment ; ni l'une
ni l'autre ne répète l'autre.

**PRÉREQUIS :** appliquer `preflight` (setup, sources, mode one-shot), exception : cette
skill tourne dans un repo de code, `preflight` y lit le `CLAUDE.md` du repo ; `writing-rules`
à toute rédaction.

## Prérequis

| | |
|---|---|
| Racine | Le repo de code |
| Clés `CLAUDE.md` | Les conventions de nommage et d'emplacement, si elles y sont ; les commandes de vérification |
| Sources à balayer | Deux à trois exemplaires existants de l'artefact dans le code ; `CLAUDE.md`, `.claude/rules/`, les ADR ; la skill ou la règle déjà présente pour cet artefact, s'il y en a une |
| Connecteurs | aucun |

## Étape 1 : nommer l'artefact et ses fichiers

- Le nom, au singulier, en kebab-case : `component`, `finder`, `proto`.
- Les globs des fichiers qui le constituent, en partant des exemplaires existants :
  `git ls-files | grep -E '…'`. Un glob doit correspondre à au moins un fichier réel.
- Ce que l'artefact n'est pas, quand un voisin prête à confusion (un finder n'est pas un
  repository ; un proto n'est pas une page).

## Étape 2 : extraire les conventions des exemples

Lire deux à trois exemplaires en entier, et relever :

- la **structure** : fichiers, sections, ordre ;
- le **nommage** : classe, fichier, dossier, avec un exemple et un contre-exemple ;
- l'**emplacement** ;
- les **règles** tenues par tous les exemples : ce qu'ils font, ce qu'ils ne font jamais ;
- les **variantes** légitimes (deux formes acceptées) et les **écarts** (un exemple qui
  déroge : le signaler à l'utilisateur, pas en faire une règle).

Une convention n'entre dans la règle que si deux exemples au moins la tiennent, ou si
l'utilisateur la dicte. Un pressentiment devient une question, pas une règle.

## Étape 3 : écrire la règle

`.claude/rules/<artefact>.md` :

```markdown
---
paths: <glob 1>, <glob 2>
---

# <Artefact> : conventions

<Une à trois lignes : ce qu'est l'artefact, ce qu'il n'est pas.>

## Structure

<Fichiers, sections, ordre. Un exemple court tiré du code, anonymisé si besoin.>

## Nommage et emplacement

| Élément | Forme | Exemple | À éviter |
|---|---|---|---|

## Règles

- <Règle, avec son pourquoi en une proposition.>
- ❌ <Anti-motif précis, celui qu'on a vu ou qu'on craint.>

## Voir aussi

<Les règles voisines (`./autre.md`), sans en recopier le contenu.>
```

Le `paths:` est une liste de globs séparés par des virgules. Sans `paths:`, la règle se
charge à chaque session : réservé à ce qui vaut partout.

## Étape 4 : écrire le scaffold

`.claude/skills/create-<artefact>/SKILL.md` :

```markdown
---
name: create-<artefact>
description: Crée un <artefact> (<ce que c'est, en une proposition>) en respectant `.claude/rules/<artefact>.md`. À utiliser quand l'utilisateur dit "crée un <artefact>", "nouveau <artefact>", "ajoute un <artefact> pour X". Ne pas utiliser pour <l'artefact voisin> : c'est create-<voisin>.
argument-hint: "<nom> [options]"
---

# Créer un <artefact>

**PRÉREQUIS :** lire `.claude/rules/<artefact>.md` en entier avant d'écrire.

## Avant de commencer

- <Ce qu'il faut savoir : l'entité, le module, le périmètre.>
- Chercher un exemplaire existant qui fait déjà ce qu'on veut : `git ls-files | grep …`.

## Fichiers à créer ou modifier

<Arbre des fichiers, avec le rôle de chacun. Les index ou registres à mettre à jour.>

## Étapes

1. <Fichier par fichier, avec un extrait minimal de chacun.>
2. …
N. Vérifier : <les commandes du CLAUDE.md : typecheck, lint, test>.

## Liste de vérification

- [ ] <Un point par règle de `.claude/rules/<artefact>.md`, formulé comme un fait vérifiable.>
- [ ] <Les registres mis à jour.>
- [ ] <La vérification passe.>
```

Le scaffold cite la règle, il ne la recopie pas. Ses extraits de code sont minimaux et
réels : tirés d'un exemplaire du repo, pas écrits de mémoire.

## Étape 5 : vérifier

- Chaque glob de `paths:` correspond à au moins un fichier (`git ls-files`).
- La skill cite la règle par son chemin exact.
- Si une règle ou une skill existait déjà pour cet artefact : la nouvelle la remplace ou
  la complète, jamais un doublon. Si le `CLAUDE.md` tient une carte « où vit chaque
  règle », y ajouter la ligne.
- Relire les deux fichiers avec `writing-rules`.

## Étape 6 : rendre la main

Les deux fichiers créés ; les conventions retenues et, à part, les écarts observés dans le
code et les points incertains laissés à l'utilisateur. Les sources balayées et celles
écartées, avec la raison.

## Garde-fous

- Jamais une convention qu'aucun exemple ne tient et que l'utilisateur n'a pas dictée.
- Une règle par artefact ; un artefact par règle. Deux objets qui se ressemblent mais
  diffèrent par leur rôle sont deux règles, qui se citent.
- Aucune valeur propre au projet dans le scaffold au-delà des chemins du repo : pas d'URL,
  pas d'identifiant d'équipe.
- La règle décrit l'état présent ; pas d'historique, pas de date.
