# Déploiement Hostinger

## Scripts
- Build client + serveur: `npm run build`
- Démarrage production: `npm run start`

## Points importants
- Le serveur Node est maintenant buildé en **CommonJS** (`dist-server/index.cjs`) pour éviter l'erreur `Dynamic require of "path" is not supported`.
- Le client Socket.IO utilise uniquement `websocket` avec **3 tentatives max** pour éviter les boucles de requêtes en 503.
- Les requêtes bootstrap ont été réduites côté front.
- La base de données a été normalisée pour MySQL/SQLite avec des identifiants cohérents (`categories.id`, `badges.id`, `shop_items.id` en texte).

## Variables `.env`
Copier `.env.example` vers `.env` puis compléter les accès MySQL Hostinger.

## Reverse proxy Hostinger
Vérifier que Hostinger proxifie bien:
- `/api/*`
- `/socket.io/*`
vers le process Node.

## Conseils
- En production, utiliser MySQL Hostinger (`USE_MYSQL=true`).
- Garder SQLite seulement en fallback local.
