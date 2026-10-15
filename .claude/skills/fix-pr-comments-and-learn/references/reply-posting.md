# Répondre aux commentaires de revue

## Signature

Chaque réponse postée par Claude porte cet en-tête et ce marqueur caché :

```markdown
> <img src="https://avatars.githubusercontent.com/u/76263028" width="16" height="16" /> **Claude** · [Claude Code](https://claude.com/claude-code)

{contenu de la réponse}

<!-- claude-code-reply -->
```

## Doublons

Avant de poster, lire les réponses existantes du fil et chercher le marqueur
`<!-- claude-code-reply -->`. Une réponse de Claude existe déjà : ne pas en poster une
seconde.

## Publication

**Commentaire en ligne** (réponse dans le fil, avec l'identifiant du commentaire
d'origine) :

```bash
gh api repos/<owner>/<repo>/pulls/<n>/comments \
  -f body="<signature + réponse + marqueur>" \
  -F in_reply_to=<id du commentaire d'origine>
```

Si l'appel renvoie 404 :
`gh api repos/<owner>/<repo>/pulls/<n>/comments/<id>/replies -X POST -f body="…"`.

**Commentaire général** (hors d'une ligne du diff) :

```bash
gh pr comment <n> --body "<signature + réponse + marqueur>"
```

## Résolution des fils

Seulement pour une correction pertinente, appliquée et vérifiée. En GraphQL :

1. L'`id` du fil vient de la requête `reviewThreads` (étape 2 de la skill).
2. Résoudre :

```bash
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<id du fil>"}) { thread { isResolved } } }'
```

Ne pas résoudre une question, un commentaire non pertinent ou ambigu : la décision
revient aux humains.

## Erreurs

Un envoi échoue (403, quota, réseau) : consigner l'échec, afficher la réponse préparée
pour que l'utilisateur la poste à la main, et la lister dans « réponses non postées » du
compte rendu final.
