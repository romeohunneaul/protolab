---
name: review-pr
description: Relit une PR GitHub ou les changements locaux d'un repo de code. Délègue l'analyse à un relecteur lancé en sous-agent (prompt dans references/reviewer.md), trie chaque suggestion avec l'utilisateur, puis poste une seule revue groupée (mode PR) ou applique les corrections (mode local), et ajoute aux règles du repo celles qu'une suggestion a fait respecter sans qu'elles soient écrites. À utiliser quand l'utilisateur dit "relis cette PR", "review la PR 42", "fais une code review", "commente la PR", ou après un `gh pr create`. Ne pas utiliser pour traiter les commentaires reçus sur sa propre PR : c'est fix-pr-comments-and-learn.
argument-hint: "[numéro ou URL de PR, ou fichiers à cibler]"
---

# Relire une PR

Le relecteur trouve les problèmes ; l'utilisateur décide de ce qui est posté. Rien n'est
posté ni appliqué sans sa confirmation. Le relecteur ne modifie jamais rien : il rend une
liste de suggestions, chacune à un endroit précis, avec le code de remplacement.

**PRÉREQUIS :** appliquer `preflight` (setup, sources, mode one-shot), exception : cette
skill tourne dans un repo de code, `preflight` y lit le `CLAUDE.md` du repo ; `writing-rules`
à toute rédaction s'il est joignable.

## Prérequis

| | |
|---|---|
| Racine | Le repo de code (racine du dépôt git) |
| Clés `CLAUDE.md` | Les commandes de vérification (lint, typecheck, tests) ; la carte « où vit chaque règle » si le repo en tient une |
| Sources à balayer | `CLAUDE.md`, `AGENTS.md`, `.claude/rules/*.md`, les ADR du repo ; le diff ; l'issue ou le ticket cité par la PR |
| Connecteurs | `gh` authentifié ; le tracker du repo si un ticket est cité |

## Étape 1 : détecter le mode

D'après `$ARGUMENTS` :

- Un numéro ou une URL de PR → **mode PR**. Un `#N` sans le mot « PR » est ambigu :
  lancer `gh pr view N` et `gh issue view N` en parallèle. `gh issue view` ne échoue pas
  sur une PR (GitHub les traite comme des issues) : trancher sur le contenu.
- Aucun argument → `gh pr view --json number,url` sur la branche courante.
  - Une PR ouverte → mode PR.
  - Sinon `git diff --stat origin/<branche par défaut>` : des changements → **mode
    local** ; aucun → « Rien à relire », et s'arrêter.

Le dépôt se lit avec `gh repo view --json nameWithOwner -q .nameWithOwner`. Ne jamais
l'écrire en dur.

> `gh` qui échoue en authentification : relancer avec `env -u GITHUB_TOKEN`, un
> `GITHUB_TOKEN` périmé dans le profil du shell est la cause habituelle.

## Étape 2 : déléguer l'analyse

Lancer un sous-agent au premier plan (outil `Agent`, type `general-purpose`) avec, dans son
prompt :

1. le contenu intégral de `references/reviewer.md` ;
2. le mode (numéro de PR et dépôt, ou « mode local ») ;
3. le contexte donné par l'utilisateur : ticket, maquette, fichiers à cibler, inquiétude
   particulière.

Attendre sa réponse. Ne pas refaire l'analyse soi-même : le relecteur a lu les fichiers en
entier et les règles du repo.

## Étape 3 : présenter la vue d'ensemble

Depuis la réponse du relecteur :

1. **Points positifs**, tels quels.
2. **Nombre de suggestions**, par sévérité : bloquant / à corriger / détail.

Zéro suggestion → « Revue propre, aucune suggestion », puis étape 7.

## Étape 4 : trier avec l'utilisateur

Une suggestion à la fois, avec `AskUserQuestion` :

- `preview` : le bloc `suggestion` du relecteur (le code de remplacement). Sans bloc
  (question, doute), le code concerné.
- Question : `fichier:ligne`, sévérité, explication, lien de documentation s'il y en a.
- En-tête : le nom court du fichier (12 caractères au plus).
- Options : **Accepter** / **Passer**. L'option « Autre » intégrée couvre la discussion ;
  après l'échange, représenter la suggestion avec les deux options.

## Étape 5 : récapituler avant d'agir

```
## Revue : N commentaires seront postés sur la PR #<n>
- `fichier.ts:42-45` : remplacer X par Y
```

ou, en mode local, « N corrections seront appliquées ». Puis `AskUserQuestion` :
**Continuer** / **Revoir**. « Autre » : appliquer l'ajustement décrit, puis représenter le
récapitulatif.

## Étape 6 : agir

Seulement après la confirmation de l'étape 5.

### Mode PR : une seule revue

```sh
gh api --method POST repos/<owner>/<repo>/pulls/<n>/reviews \
  --field event=COMMENT \
  --field body="## Revue Claude Code

<N> suggestion(s)." \
  --field "comments[][path]=<fichier>" \
  --field "comments[][line]=<ligne>" \
  --field "comments[][side]=RIGHT" \
  --field "comments[][body]=<corps>"
```

Corps de chaque commentaire, dans cet ordre : le bloc `suggestion`, l'explication, le pied
`Authored-By: <nom du modèle en cours> <noreply@anthropic.com>`.

- Le bloc `suggestion` ne contient que le code de remplacement : ni explication, ni bloc
  imbriqué, qui cassent le rendu GitHub.
- Un commentaire par emplacement. Plusieurs lignes : ajouter
  `comments[][start_line]` et `comments[][start_side]=RIGHT`.
- Une question sans code : l'explication seule, avec le pied.
- Jamais `event=APPROVE` ni `REQUEST_CHANGES`. La décision appartient à l'utilisateur.

Pour répondre à un commentaire existant plutôt qu'en ouvrir un :
`gh api repos/<owner>/<repo>/pulls/<n>/comments/<id>/replies -X POST -f body="…"`.

### Mode local : appliquer

Chaque suggestion acceptée, avec l'outil `Edit`. Ne pas commiter : les changements restent
à la disposition de l'utilisateur.

## Étape 7 : fermer la boucle sur les règles

Pour chaque suggestion **bloquante** ou **à corriger** qui a fait respecter une règle que le
repo n'écrit nulle part :

1. Chercher la règle dans `CLAUDE.md`, `.claude/rules/*.md`, les ADR.
2. Absente ou partielle : l'ajouter dans le fichier que la carte « où vit chaque règle » du
   `CLAUDE.md` désigne ; sans carte, dans la règle `.claude/rules/<sujet>.md` dont les
   `paths:` couvrent les fichiers concernés ; sans règle, dans `CLAUDE.md`. Respecter la
   forme du fichier (puces, lignes de tableau).
3. Pas de préférence de détail : seulement ce qui doit être tenu à chaque fois.
4. Ne jamais modifier une convention existante : ajouter, et dire ce qui a été ajouté.

## Étape 8 : rendre la main

Ce qui a été posté ou appliqué, les règles ajoutées, la suite naturelle (relancer la CI,
commiter, demander une nouvelle relecture). Les sources balayées et celles écartées, avec
la raison.

## Garde-fous

- Ne jamais approuver ni demander des changements par l'API.
- Ne pas signaler un motif préexistant, sauf s'il casse avec le nouveau code. Le relecteur
  tient cette ligne ; la tenir aussi au tri.
- Le relecteur a lu les fichiers et les règles : le rôle ici est l'orchestration et le
  dialogue, pas une seconde relecture.
