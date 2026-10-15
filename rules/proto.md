---
paths: src/lab/protos/**/*.tsx
---

# Proto : conventions

Un proto est un composant React du projet hôte, inscrit au manifest du lab, servi à
`<basePath>/p/<slug>`, qui réutilise les composants du projet. Ce n'est pas une page de l'app
(il n'a pas de route à lui hors du lab), ni une maquette HTML, ni un composant du design system.

## Structure

```
<protosDir>/<slug>/
  index.tsx        # export default : le composant racine du proto
```

```tsx
"use client";                                  // seulement si le proto lit un hook du lab
import { useAxis, useScreen } from "@romeohunneaul/protolab";

export default function InvoiceList() {        // PascalCase du slug
  const density = useAxis("density");          // une valeur d'axe, lue depuis l'URL
  const { screen, go } = useScreen();          // l'écran courant, et le passage à un autre
  …
}
```

L'entrée au manifest (`slug`, `name`, `author`, `description`, `load`, puis `axes`, `screens`
optionnels) est écrite par `protolab-new` et complétée par les skills ; `load` importe
`./protos/<slug>`.

## Nommage et emplacement

| Élément | Forme | Exemple | À éviter |
|---|---|---|---|
| Dossier | `<protosDir>/<slug>/`, slug en kebab-case | `src/lab/protos/invoice-list/` | `InvoiceList/`, `invoice_list/`, un fichier sans dossier |
| Fichier racine | `index.tsx`, export par défaut | `index.tsx` | `InvoiceList.tsx`, un export nommé |
| Composant | PascalCase du slug | `InvoiceList` | `Proto`, `Page`, `Index` |
| Clé d'axe, d'écran | kebab-case, nommée d'après ce qui varie | `density`, `state`, `detail` | `Density`, `axis1` |
| Sous-composants propres au proto | dans le dossier du proto | `invoice-list/row.tsx` | dans `componentsDir` |

## Règles

- Le proto emploie les composants réels du projet, importés depuis `componentsDir`, sans
  recopier ni surcharger leur style : la fidélité au design system est ce qui rend le proto
  crédible. Une bibliothèque hors design system n'est permise que si la configuration la liste.
- Une variation (un état, une mise en page, une densité) est un axe déclaré au manifest et lu
  par `useAxis` ; un enchaînement d'écrans est déclaré en `screens` et piloté par `useScreen`.
  Jamais un état local qui doublerait l'URL : l'URL est l'état, un lien doit restaurer l'écran.
- `"use client"` ouvre le fichier dès qu'il lit un hook du lab ou a de l'interactivité ; sinon
  il reste un composant serveur.
- Le proto n'appelle aucun service : ses données sont dans le fichier ou dans un jeu de données
  déclaré au manifest. Il n'ajoute aucune dépendance au projet hôte.
- Les libellés sont dans la langue du projet hôte, même si la conversation est dans une autre.
- Le proto est jetable et hors production (le lab est `noindex`) : ni test ni accessibilité
  exhaustive exigés, sauf demande.
- ❌ Un `.html` statique ou une capture à la place d'un composant.
- ❌ Une entrée de manifest écrite à la main pour un nouveau proto : `protolab-new` l'écrit.
- ❌ Un composant du design system copié dans le dossier du proto pour le modifier.
- ❌ Un `useState` qui porte une variante que le panneau devrait piloter.

## Voir aussi

- `.claude/skills/protolab-create/SKILL.md` : créer un proto ; `protolab-variant` : ajouter un axe ;
  `protolab-ds-context` : lire le design system avant d'écrire.
- Le README du paquet `@romeohunneaul/protolab` : le manifest, les hooks, le panneau.
