---
name: protolab-create
description: Crée un prototype dans le lab du projet hôte (dossier des protos + entrée au manifest, via le scaffolder `protolab-new`) en réutilisant les vrais composants du projet. À utiliser quand l'utilisateur dit "nouveau proto", "prototype la feature X", "crée un proto pour…", ou veut essayer une idée d'écran ou d'interaction. Génère un composant fidèle au design system, jamais une maquette HTML statique.
---

# protolab — créer un prototype

Objectif : passer d'une intention de feature à un écran qui tourne à `<basePath>/p/<slug>`, en
**réutilisant les composants du projet**. La métrique qui compte est le temps entre « j'ai une
idée » et « je la vois à l'écran », pas la cérémonie.

> **Principe.** Toute règle est payée par l'agent, pas par l'utilisateur. Ne bloque jamais sur
> un défaut que tu peux corriger seul. Au moindre arbitrage produit → `AskUserQuestion`.

## Configuration

Les chemins viennent de `protolab.config.json` à la racine du projet (défauts entre parenthèses) :
`protosDir` (`src/lab/protos`), `manifest` (`src/lab/manifest.ts`), `componentsDir`
(`src/components/ui`), `basePath` (`/lab`). Le lire avant de commencer ; ne jamais supposer un
autre chemin.

## Étape 0 — Contexte de la feature

Avant de coder, réunis le contexte, dans cet ordre :
1. **Ce que l'utilisateur décrit** : l'intention. Reformule en 1 à 2 phrases plus les états
   visibles attendus. Note les ambiguïtés, ne les devine pas.
2. **L'existant du projet** : si la feature touche une zone déjà codée, lis-la. Le proto doit
   ressembler à l'existant, pas partir de zéro.
3. **Le design system** : lance `protolab-ds-context` pour savoir quels composants tu as le
   droit d'employer.

Si l'intention est trop vague pour un écran → `AskUserQuestion` avec des défauts proposés,
jamais un blocage sec.

## Étape 1 — Scaffolder

Un proto = un dossier + une entrée manifest. **Le scaffolder crée les deux.** Ne les écris pas
à la main : une insertion manuelle dans le tableau casse vite `load:` ou la virgule.

```
npx protolab-new <slug> "<Nom>" "<Auteur>" "<Description>"
```

- `slug` en kebab-case (le script le vérifie et refuse un doublon).
- Il crée `<protosDir>/<slug>/index.tsx` (composant standalone de départ) et insère l'entrée
  dans le manifest (`load` compris), puis imprime `<basePath>/p/<slug>`.

## Étape 2 — Construire dedans

Édite `<protosDir>/<slug>/index.tsx` :
- `"use client"` en tête **si** le proto lit un axe (`useAxis`) ou a de l'interactivité (déjà
  présent dans le fichier de départ).
- Importe les composants réels depuis `<componentsDir>`, jamais recopier leur style.
- Langue des libellés : celle du projet hôte, même si l'échange est dans une autre langue.
- Pour des variantes (états, layouts) → enchaîne avec `protolab-variant` (ajoute les `axes` au
  manifest et les `useAxis` dans le composant).

## Étape 3 — Vérifier

- Le code compile : `npx tsc --noEmit` (ou le check du projet).
- **Ne pas** lancer l'app pour juger le rendu à la place de l'utilisateur : la vérification
  visuelle se fait dans le navigateur, c'est son travail. Toi tu garantis que ça compile et que
  le design system est respecté.
- Donne l'URL : `<basePath>/p/<slug>`.

## Règles

- **Livrable = composant React standalone** réutilisant le design system. Un `.html` statique
  n'est jamais valide.
- **Jamais inventer** un composant, une prop, une classe : vérifie via `protolab-ds-context`.
- **CSS custom = dernier recours**, en classes ou tokens du projet uniquement, après validation.
- Le proto est **jetable et hors prod** (le lab est `noindex`) : pas de test, pas d'a11y
  exhaustive exigés, sauf si l'utilisateur le demande.
