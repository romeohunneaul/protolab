---
name: writing-rules
description: Règles d'écriture des documents produit relus par des humains et lus par des agents (PRD, specs fonctionnelles, ADR, journal de feature, glossaire, jobs), et de la prose publiée hors du repo (description de PR, page de wiki, message de compte rendu). À appliquer dès qu'on rédige, corrige ou relit un tel document ("rédige", "écris la PRD", "relis ce doc", "corrige la section", "reformule"), et avant de rendre tout document généré.
---

# Règles d'écriture

Un document produit est relu vite par un humain et interprété sans ambiguïté par un
agent. Ces règles visent les deux lectures. La **structure** des documents (sections,
fichiers) est définie par le `docs/knowledge-structure.md` du projet ; ce skill porte
l'**écriture**.

**PRÉREQUIS :** appliquer `preflight` (setup, sources, mode one-shot).

## Prérequis

| | |
|---|---|
| Racine | Product OS (`CLAUDE.md`, `problem/`, `solution/`) |
| Clés `CLAUDE.md` | `## Connaissance produit` : `Langue des documents`, `Langue des libellés d'écran cités`, `Glossaire` |
| Sources à balayer | `docs/glossary.md` ; le document à écrire ou relire |
| Connecteurs | aucun |

## Le glossaire est l'arbitre

- **Un concept, un terme.** Employer le terme du glossaire, sans le traduire ni le
  remplacer par un synonyme.
- **Une relation, un verbe.** La table « Relations et actions » du glossaire fixe le verbe
  de chaque relation. Un verbe-image à la place du verbe métier est le défaut le plus
  fréquent en relecture.
- **Un mot, un objet.** Si un même mot désigne deux objets dans le document (par exemple
  la ligne d'un import et le document qu'elle cible), chaque règle qui l'emploie devient
  ambiguë. Nommer les deux objets différemment.
- Un terme nécessaire et absent du glossaire y entre **dans la même modification** que le
  document. Un document qui contredit le glossaire se corrige ; le glossaire ne se plie
  pas au document.

## Comportement observable, jamais d'identifiant de code

Un PRD ou une spec décrit ce que l'utilisateur voit, décide et obtient, et les règles
métier. Il ne nomme ni champ, ni état interne, ni endpoint, ni event, ni feature flag :
nommer un champ fige un choix qui appartient aux développeurs. Écrire « le montant brut
de la ligne », pas `gross_amount`. Les identifiants vont dans les ADR, les contrats d'API
et le code.

**Un libellé d'écran se cite dans sa langue source**, entre `code spans`, même dans un
document rédigé dans une autre langue. Les traductions sont produites ensuite ; citer une
traduction revient à citer un texte que personne ne maintient.

## Français plat : la phrase se lit sans être relue

- **Sujet nommé, verbe ordinaire, complément.** Le verbe est celui qu'un collègue
  emploierait à l'oral. « L'utilisateur supprime la ligne », pas « suppression de la
  ligne par l'utilisateur ».
- **L'utilisateur est le sujet** quand la phrase décrit une action ou une expérience.
- **Pas de nominalisation ni de compression.** Une subordonnée pliée en groupe nominal se
  déplie en phrase avec son verbe.
- **Une relative empilée devient une conditionnelle.** « Si le système reçoit une valeur
  déjà saisie à la main, la valeur manuelle reste » se lit en une fois.
- **Pas de maxime.** L'antithèse (« X, pas Y »), la clivée (« c'est X qui ») et le refrain
  en tête de phrases successives sont des effets d'insistance : une fois par section au
  plus, jamais pour énoncer un fait.
- **Pas d'abréviation ni de symbole dans la prose.**
- **Une phrase, une idée.** Une énumération de cas va en liste ou en tableau, jamais dans
  des parenthèses imbriquées.
- **Nommer les deux grandeurs d'une comparaison.** « L'écart entre A et B » ne dit rien si
  A et B sont des objets et pas des montants.

## Raccourcir en coupant du contenu

Une section trop longue perd une redite, un cas secondaire, un détail qui descend dans une
spec. Elle ne perd jamais ses mots-outils : une phrase illisible née d'une contrainte de
place signale que la coupe a porté sur la syntaxe.

- **Chapô** : un document, et toute section longue, s'ouvre sur deux ou trois lignes qui
  donnent l'essentiel. Pas de section « Résumé » ni « Conclusion ».
- **Le document ne parle pas de lui-même.** Pas de « ce fichier décrit… » : le chapô
  énonce le périmètre comme un fait.
- **Ne pas redire l'inchangé.** Une phrase vraie sans la feature, et dont personne ne
  douterait, se supprime.
- **Un lien plutôt qu'une redite.** Une information vit à un seul endroit.

## Chaque affirmation est un fait ou porte un marqueur

| Marqueur | Sens |
|---|---|
| **Hors V1** (ou un autre périmètre nommé) | Écarté ou différé, avec la raison |
| **À valider [qui]** | Question ouverte, avec la personne qui tranche |

- Un choix tranché s'écrit au présent, sans marqueur. Sa date et sa raison vont dans le
  journal de la feature.
- « Pour le moment », « plus tard », « temporairement » sont interdits sans marqueur : le
  lecteur ne sait pas si la situation est un choix ou un accident.
- Un comportement inventé pendant la rédaction, qu'aucune décision ne trace, porte
  **À valider [qui]**.
- Dates absolues (2026-07-07), jamais « la semaine dernière ».

## Vocabulaire normatif

En majuscules, ces mots ont le sens de la RFC 2119 ; en minuscules, leur sens courant.

| Mot | Sens |
|---|---|
| **DOIT** / **NE DOIT PAS** | Exigence absolue / interdiction absolue |
| **DEVRAIT** / **NE DEVRAIT PAS** | Recommandé / déconseillé ; s'en écarter demande une raison écrite |
| **PEUT** | Optionnel |

Le comportement normatif s'écrit au présent, jamais au futur.

## Schémas

Un schéma Mermaid se justifie pour un parcours à branches, un cycle de vie ou un
enchaînement entre acteurs. Une règle simple ou une liste courte n'en justifie pas. Le
schéma remplace le paragraphe : ne pas le paraphraser juste après. Au-delà d'une quinzaine
de nœuds, le couper en vue d'ensemble et zoom.

## Ponctuation

- Pas de tiret cadratin (—) : une virgule, deux-points, une parenthèse ou une phrase à
  part rendent le lien logique explicite.
- Une parenthèse est un court aparté, jamais sur plus d'une ligne.
- Le gras est réservé aux termes clés et aux marqueurs, jamais à une phrase entière.

## Checklist avant de rendre

1. Chaque concept emploie le terme du glossaire, chaque relation son verbe ; les termes
   nouveaux sont entrés au glossaire.
2. Aucun identifiant de code dans un PRD ou une spec.
3. La bonne langue ; les libellés d'écran cités dans leur langue source.
4. Chaque phrase a un sujet nommé et un verbe conjugué ; ni maxime, ni nominalisation.
5. Chaque affirmation est un fait présent ou porte son marqueur ; dates absolues.
6. Les énumérations sont en liste ou en tableau.
7. Un chapô ouvre le document ; l'essentiel de chaque section tient dans ses dix premières
   lignes.
8. Pas de tiret cadratin ; gras limité aux termes clés.
