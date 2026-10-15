---
name: claude-config-audit
description: Audite l'arbre `.claude/` d'un repo (skills, règles, hooks, settings, agents) et les documents que `CLAUDE.md` cite, et rapporte ce qui est cassé, périmé ou incohérent : globs de règles qui ne correspondent à rien, références croisées skill → règle qui ne résolvent plus, permissions ponctuelles accumulées dans `settings.local.json`, scripts de hook absents, skills hors conventions. Lecture seule : propose un plan de nettoyage et attend l'approbation avant d'éditer. À lancer après une série de changements sur les skills, règles ou hooks, en fin de lot, ou quand quelque chose ne se charge plus comme attendu.
disable-model-invocation: true
---

# Auditer la configuration `.claude/`

L'arbre `.claude/` dérive : une règle est renommée, une skill cite une règle qui a bougé,
`settings.local.json` accumule des permissions d'un jour, un script de hook disparaît mais
reste référencé. Cette skill passe méthodiquement sur tout l'arbre, en lecture seule, et
dit ce qui ne va pas.

**PRÉREQUIS :** appliquer `preflight` (setup, sources, mode one-shot), exception : cette
skill tourne dans n'importe quel repo, Product OS ou repo de code, `preflight` y lit le
`CLAUDE.md` ; `writing-rules` à toute rédaction s'il est joignable.

## Prérequis

| | |
|---|---|
| Racine | Le repo audité (lancer depuis sa racine) |
| Clés `CLAUDE.md` | aucune ; le fichier lui-même est audité |
| Sources à balayer | `.claude/` en entier ; `CLAUDE.md` et tout fichier qu'il cite ; `docs/skill-conventions.md` s'il existe |
| Connecteurs | aucun |

## Règle : lecture seule pendant l'audit

L'audit ne touche aucun fichier : ni `Edit`, ni `Write`, ni `git`. Il produit un rapport,
l'utilisateur approuve le nettoyage, et seulement alors on édite.

## Vérifications, dans l'ordre

### 1. Les `paths:` des règles

Pour chaque `.claude/rules/**/*.md` qui déclare `paths:` : chaque glob doit correspondre à
au moins un fichier de l'arbre de travail. Un glob sans correspondance signale une cible
déplacée. Signaler aussi un segment dupliqué (`src/src/`, `apps/apps/`), dérive classique
d'un copier-coller.

```bash
grep -rl "^paths:" .claude/rules/
```

Pour chaque glob : `git ls-files | grep -E '<glob traduit>'`, ou l'outil `Glob`.

### 2. Les références croisées

Dans `.claude/skills/`, `.claude/agents/`, `.claude/commands/` : chaque
`.claude/rules/<…>.md`, chaque `references/<…>.md`, chaque nom de skill cité doit exister.

```bash
grep -rnoE "\.claude/rules/[A-Za-z0-9/_-]+\.md|references/[A-Za-z0-9/_-]+\.md" .claude/skills .claude/agents .claude/commands 2>/dev/null
```

### 3. `CLAUDE.md` et les documents cités

Chaque chemin de fichier et chaque nom de skill (`/nom`, `` `nom` ``) que `CLAUDE.md`
mentionne doit exister : `.claude/skills/<nom>/SKILL.md`, `docs/<…>.md`, ADR.

```bash
grep -noE "[A-Za-z0-9_./-]+\.md" CLAUDE.md | sort -u
```

### 4. `settings.local.json` : entrées ponctuelles

Ce fichier est propre à la machine et accumule des permissions ad hoc. Signaler celles qui
ressemblent à un usage unique : version épinglée d'un outil de bootstrap, chemin sous
`/tmp/`, `rm -rf` ou `rsync` d'une migration passée, commande liée à une branche ou un
worktree disparu, doublons, entrées déjà couvertes par une règle plus large de
`.claude/settings.json`.

```bash
jq -r '.permissions.allow[]?' .claude/settings.local.json | sort | uniq -d
jq -r '.permissions.allow[]? | select(test("/tmp/|rm -rf|rsync"))' .claude/settings.local.json
jq '.permissions.allow | length' .claude/settings.local.json
```

Proposer une liste à purger. Ne jamais éditer sans accord : certaines entrées sont gardées
exprès.

### 5. Les hooks

Chaque `command` sous `hooks.<événement>` de `.claude/settings.json` doit exister et être
exécutable ; inversement, un script sous `.claude/hooks/` que rien ne référence est mort.

```bash
jq -r '.hooks[]?[].hooks[]?.command // empty' .claude/settings.json \
  | grep -oE '\.claude/hooks/[A-Za-z0-9_.-]+' \
  | while read -r cmd; do [ -x "$cmd" ] && echo "OK   $cmd" || echo "MISS $cmd"; done
ls .claude/hooks/ 2>/dev/null
```

### 6. Les agents

Pour chaque `.claude/agents/*.md` : frontmatter avec `name` (égal au nom de fichier),
`description`, `tools` (ou omis exprès), `model` s'il est épinglé. Un agent dont `tools`
liste `Edit` ou `Write` peut modifier des fichiers : le dire, pour que l'utilisateur sache
lesquels sont en lecture seule.

### 7. Les skills

Pour chaque `.claude/skills/*/SKILL.md` :

- `name` et `description` présents ; la description dit quand déclencher et quand ne pas
  déclencher.
- `disable-model-invocation` relevé (true = seulement via `/<nom>`), pour que
  l'utilisateur vérifie la politique d'un coup d'œil.
- Si `docs/skill-conventions.md` existe : passer sa liste de vérification sur chaque
  skill (ligne `**PRÉREQUIS :**`, tableau `## Prérequis`, compte rendu des sources,
  aucune URL ni identifiant de projet dans le corps).

```bash
for f in .claude/skills/*/SKILL.md; do
  echo "$f: $(grep -m1 'disable-model-invocation' "$f" || echo '(invocable par le modèle)')"
done
```

## Rapport

Un seul document :

```
## Cassé (à corriger)
- <fichier> : <la casse, en une ligne>

## Périmé (à retirer ou mettre à jour, sans risque probable)
- <fichier ou entrée de settings.local> : <une ligne>

## OK (audité, rien à faire)
- skills : <n> · règles : <n> · hooks : <n> · agents : <n>
- entrées de settings.local.json auditées : <n> (signalées : <n>)

## Plan de nettoyage proposé
1. <action atomique>
2. <action atomique>
```

Terminer par : « Audit prêt. Valide le plan de nettoyage et je l'applique, ou ajuste-le. »
Puis attendre. Une fois le plan approuvé, l'appliquer, et commiter avec la skill de commit
du repo s'il en a une.

## Rendre la main

Le rapport ; après approbation, ce qui a été nettoyé. Les sources balayées et celles
écartées, avec la raison.

## Garde-fous

- Lecture seule tant que l'utilisateur n'a pas approuvé.
- `settings.local.json` appartient à l'utilisateur : proposer, jamais réécrire.
- Ne pas élargir au code source : le périmètre est `.claude/` et ce que `CLAUDE.md` cite.
