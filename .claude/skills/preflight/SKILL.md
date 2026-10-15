---
name: preflight
description: Vérification de départ commune à toutes les skills du Product OS, appelée en PRÉREQUIS par chacune. Confirme qu'on est à la racine du Product OS, lit les clés du CLAUDE.md dont la skill a besoin, résout chaque source à balayer dans la section `## Sources et outils` du CLAUDE.md (et complète cette section quand une source manque, au lieu de redemander au prochain lancement), vérifie les connecteurs disponibles, applique le mode one-shot quand les entrées sont déjà fournies, et impose en fin de skill le compte rendu des sources balayées et écartées. Ne pas déclencher seule : elle n'a de sens qu'au début d'une autre skill.
---

# Preflight : vérifier le setup avant d'agir

Chaque skill du Product OS déclare dans sa section `## Prérequis` ce dont elle a besoin :
clés du `CLAUDE.md`, sources à balayer, connecteurs. Cette skill dit comment vérifier ces
besoins, une fois pour toutes. Le `CLAUDE.md` porte les valeurs ; la skill porte la liste.

Pourquoi : à `/init`, le `CLAUDE.md` est rempli à grands traits. Les sources précises
(une base Notion, un canal Slack, un fichier Figma) arrivent plus tard, au premier
lancement de la skill qui en a besoin. Le setup se complète donc à l'usage, et chaque
complément est écrit dans le `CLAUDE.md` pour que le lancement suivant n'ait rien à
redemander.

## 1. Racine

Le dossier courant contient `CLAUDE.md`, `problem/` et `solution/`. Sinon : si on est dans
une app sous `repos/`, le Product OS est le dossier parent de `repos/` ; le dire et lire
là-bas. Depuis le brain (`projects/<x>/_index.md` présents), les skills qui le permettent
(`synthesize-transcript` et les `synthesize-*`) prennent `projects/<x>/` comme dossier
projet et son Product OS comme racine. Sinon, s'arrêter et le dire.

## 2. Clés du `CLAUDE.md`

Lire les sections que la skill nomme (`## Connaissance produit`, `## Documentation`,
`## QA session`…). Une clé demandée et vide (`<…>` ou absente) : la demander à
l'utilisateur, une fois, puis l'écrire dans le `CLAUDE.md` avant de continuer. Ne jamais
supposer une valeur.

## 3. Sources à balayer

Pour chaque source de la liste `Sources à balayer` de la skill :

| Cas | Faire |
|---|---|
| Source interne au repo (`raw/`, `syntheses/`, `jtbd.md`, `PRD.md`, `specs/`…) | La lire. Toutes les captures d'un dossier, pas un échantillon |
| Source externe avec une ligne dans `## Sources et outils` | L'ouvrir par l'accès indiqué |
| Source externe sans ligne | Demander où elle est et par quel outil on y accède ; ajouter la ligne au tableau ; continuer |
| Ligne présente, accès `pas encore branché` | Le dire, proposer un copier-coller du contenu, ne jamais reconstituer de mémoire |
| Source déclarée, vide ou introuvable | La noter comme écartée, avec la raison, dans le compte rendu |

Le tableau `## Sources et outils` du `CLAUDE.md` est le seul registre. Une source
découverte en cours de skill (un lien cité dans un transcript, un repo mentionné en
réunion) y entre aussi, avec la colonne `Skills` à jour.

## 4. Connecteurs

Un connecteur demandé (Notion, Slack, Google Drive, Figma, GitHub, Chrome) est disponible
si ses outils sont présents dans la session. Absent : nommer le connecteur à activer, et
continuer avec l'alternative si la skill en a une (copier-coller, lecture web, `gh` en
ligne de commande). Ne pas bloquer sur un connecteur dont la skill peut se passer.

## 5. Mode one-shot / orchestré

Si les entrées de la skill sont déjà fournies, par un orchestrateur ou dans une demande
complète, ne pas les reconfirmer : appliquer les défauts documentés et ne poser une
question que sur une ambiguïté réelle et bloquante. Ce mode supprime la re-collecte des
champs, rien d'autre : les gates de sécurité d'une skill (validation avant écriture
externe, revue avant/après, confirmation avant un `git push`) restent des points de
contrôle durs.

## 6. En fin de skill : compte rendu des sources

Le compte rendu final de la skill liste chaque source de son `## Prérequis` avec l'un de
ces deux états :

- **balayée**, avec le nombre d'éléments lus quand ça a un sens (captures, PR, écrans) ;
- **écartée**, avec la raison (vide, inaccessible, hors périmètre de la demande).

Une source absente de cette liste est un oubli. C'est ce qui permet de relancer la skill
sans repréciser son périmètre : le périmètre est dans la skill et dans le `CLAUDE.md`, et
la skill prouve qu'elle l'a couvert.

## Garde-fous

- Écrire dans le `CLAUDE.md` seulement des faits donnés par l'utilisateur ou vérifiés
  (un chemin qui existe, une URL ouverte). Un fait non vérifié porte `**À valider [qui]**`.
- Ne jamais créer un dossier de thème ou de feature pour satisfaire un prérequis : renvoyer
  vers `capture-discovery` ou `create-feature`.
- Un prérequis manquant se demande une fois par session. S'il manque encore au lancement
  suivant, c'est que le `CLAUDE.md` n'a pas été mis à jour : le faire d'abord.
