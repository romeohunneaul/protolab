---
name: protolab-variant
description: Ajoute une variante (un axe) à un prototype existant du lab : un état (repos, chargement, erreur, vide), un layout, un thème, une densité. À utiliser quand l'utilisateur dit "ajoute un état", "fais une variante", "montre aussi le cas vide", "crée un axe". Chaque axe est orthogonal et pilotable depuis le switcher et l'URL.
---

# protolab — ajouter une variante (axe)

Un proto modélise ses variations comme des **axes orthogonaux** : n'importe quelle combinaison
de valeurs est valide et testable, sans dupliquer le composant en N×M copies.

## Le modèle

Un axe (type `Axis` de `@romeohunneaul/protolab`) : `{ key, label, values: [{id, label}], default? }`.
La valeur courante est dans l'URL (`?a.<key>=<id>`) : un lien restaure la combinaison exacte.

Deux usages, par convention :
- **Signal** : un état lu dans le composant, `const state = useAxis("state")`. Le composant
  branche son rendu dessus (`state === "loading" ? … : …`).
- **Layout** : une bascule de structure plus large, lue de la même façon.

## Ajouter un axe

Les chemins (`manifest`, `protosDir`) viennent de `protolab.config.json` à la racine du projet.

1. Dans le manifest, sur l'entrée du proto, ajoute ou complète `axes` :
   ```ts
   axes: [
     { key: "state", label: "State", values: [
       { id: "rest", label: "Rest" },
       { id: "empty", label: "Empty" },
       { id: "error", label: "Error" },
     ] },
   ],
   ```
2. Dans `<protosDir>/<slug>/index.tsx`, lis l'axe et branche le rendu :
   ```ts
   import { useAxis } from "@romeohunneaul/protolab";
   const state = useAxis("state");
   ```
   Le composant doit être `"use client"` (`useAxis` est un hook client).

Le panneau du lab (`LabPanel`, rendu par `ProtoView`) affiche la liste déroulante
automatiquement : rien à câbler dans l'UI.

## Axe ou écran ?

Un axe est un **mode** que le relecteur bascule depuis le panneau (vide, erreur, compact). Un
écran est une **vue** entre lesquelles le proto navigue lui-même (liste → détail, étape 1 →
étape 2). Si le proto a plusieurs vues, déclare des écrans, pas un axe :

1. Dans le manifest, sur l'entrée du proto :
   ```ts
   screens: [
     { key: "list", label: "List" },
     { key: "detail", label: "Detail" },
   ],
   ```
   Le premier écran est celui d'arrivée.
2. Dans le composant :
   ```ts
   import { useScreen } from "@romeohunneaul/protolab";
   const { screen, go } = useScreen();
   // screen === "detail" ? … ; onClick={() => go("detail")}
   ```

Chaque écran a son URL (`?screen=<key>`) : un rechargement ou un lien partagé ramène au même
écran, et le bouton Retour du navigateur remonte le parcours. Le panneau liste les écrans pour
qu'un relecteur y saute directement. Les axes restent orthogonaux aux écrans.

## Règles

- **Orthogonalité** : les valeurs d'un axe ne présument pas d'un autre axe. Si deux dimensions
  se contraignent l'une l'autre, ce sont deux axes, pas un axe combiné.
- **Défaut explicite** (`default`) quand `values[0]` n'est pas l'état de repos voulu.
- Ne pas encoder de la **donnée** dans un axe (une ligne de tableau n'est pas un axe). Un axe
  est un mode de l'écran.
