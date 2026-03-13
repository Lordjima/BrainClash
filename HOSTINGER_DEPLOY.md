# Déploiement Hostinger

1. Crée le fichier `.env` à partir de `.env.example`.
2. Mets `USE_MYSQL=true` et les vrais identifiants MySQL Hostinger.
3. Vérifie que `/api` et `/socket.io` pointent vers le process Node.
4. Lance ensuite :

```bash
npm install
npm run seed
npm run build
npm run start
```

5. Si aucune table n'apparaît dans phpMyAdmin, regarde les logs Node :
   - le projet ne bascule plus en SQLite silencieusement
   - si MySQL échoue, le process plante volontairement avec une erreur claire.
