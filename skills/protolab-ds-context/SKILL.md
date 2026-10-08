---
name: protolab-ds-context
description: Récupère le design system disponible pour un prototype du lab : les composants codés du projet hôte (dossier `componentsDir` de protolab.config.json, et leurs stories Storybook s'il y en a) et, en amont, la source design déclarée par le projet. À utiliser AVANT d'écrire ou de modifier un proto, quand l'utilisateur dit "quels composants j'ai", "récupère le storybook", "prototype avec le DS", ou dès que protolab-create doit choisir un composant. Ne jamais inventer un composant ou une prop : ce que cette skill ne trouve pas n'existe pas.
---

# protolab — contexte design system

> Règle absolue : tu ne connais un composant qu'après avoir lu son fichier dans le dossier des
> composants du projet. La donnée d'entraînement n'est jamais une source. Si tu n'as pas lu le
> fichier, tu ne sais pas.

## 1. Composants codés = source primaire

Le dossier est `componentsDir` de `protolab.config.json` (défaut `src/components/ui`). Chaque
composant a un `.tsx` et souvent un `.stories.tsx` qui documente ses états.

- Lister : `ls <componentsDir>/*.tsx | grep -v '\.stories\.\|\.test\.'`
- Pour un composant retenu, lire **son `.tsx`** (props, variants réels) **et son `.stories.tsx`**
  (les états que le designer a jugé dignes d'être montrés : c'est le contrat d'usage).
- Les classes utilitaires maison du projet sont définies dans sa feuille globale (souvent
  `src/app/globals.css`). Les réutiliser, ne pas réinventer une couleur en dur.

Ne jamais inventer une prop ou un variant. Vérifie dans le `.tsx` avant d'écrire.

## 2. Source design en amont (secondaire)

Si le projet déclare une source design (Figma, Claude Design, un Storybook publié : voir son
`CLAUDE.md` ou `design/rules.md`), la consulter quand une intention design existe mais n'a pas
encore d'équivalent codé, pour décider s'il faut composer avec l'existant ou signaler un manque.

## 3. Restitution

Rends une courte liste : composants pertinents pour la tâche, leurs props et états réels, et
les **trous** (ce que la feature demande et qu'aucun composant ne couvre). Le trou est un signal
produit, pas une invitation à écrire du CSS custom : le signaler, demander via
`AskUserQuestion` si un repli est acceptable.

## Ce que cette skill ne fait pas

Elle ne code rien. Elle prépare `protolab-create` et `protolab-variant`. CSS custom = dernier
recours, jamais sans validation explicite.
