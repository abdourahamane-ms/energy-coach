# Energy Coach

Energy Coach est une application web qui aide les ménages à **comprendre leur consommation d'énergie**, à recevoir des **recommandations personnalisées** et à suivre un **plan d'action sur 30 jours** pour réduire leur facture.

Ce dépôt contient une version finale de présentation, avec une vraie base de données, une authentification, un moteur de calcul transparent, des graphiques, un mode démo et un espace administrateur.

---

## 1. Objectifs produit

Aider l'utilisateur à :

1. comprendre sa consommation ;
2. identifier ses postes de dépense probables ;
3. recevoir des recommandations personnalisées ;
4. comprendre les calculs utilisés (« Voir le calcul ») ;
5. appliquer un plan d'action sur 30 jours ;
6. estimer l'impact avant / après ;
7. suivre sa progression.

## 2. Fonctionnalités principales

- Inscription, connexion, déconnexion, sessions sécurisées, rôles (utilisateur, admin, démo).
- Parcours guidé : profil logement → compteur → facture/consommation → appareils → habitudes.
- Moteur de calcul (les chiffres sont calculés par le système, jamais inventés par l'IA).
- Diagnostic énergétique, score sur 100, estimation avant/après.
- Recommandations personnalisées avec économies estimées et détail du calcul.
- Graphiques (répartition, avant/après, économies, progression du plan).
- Plan d'action 30 jours avec actions cochables et sauvegardées.
- Mode démo complet + simulation de compteur par QR code fixe (Linky / Gazpar / prépayé).
- IA locale optionnelle (Ollama) pour prioriser les recommandations et formuler des explications, avec repli automatique si indisponible.
- Espace administrateur (utilisateurs, appareils, sources, règles, recommandations, profils démo, QR codes).

## 3. Stack technique

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 6** + **SQLite** (base SQL locale, architecture prête pour PostgreSQL)
- **Recharts** (graphiques)
- **Zod** (validation)
- **jose** + **bcryptjs** (sessions JWT httpOnly, mots de passe hachés)
- **html5-qrcode** (scan QR côté navigateur)
- **Ollama** (IA locale, optionnelle)

## 4. Prérequis

- **Node.js 20.9+** (testé avec Node 24) et **npm**.
- (Optionnel) **Ollama** installé et lancé pour l'analyse IA — voir §12.

## 5. Installation

```bash
npm install
```

## 6. Variables d'environnement

Le fichier `.env` (déjà présent pour le développement local) contient :

```bash
DATABASE_URL="file:./dev.db"        # base SQLite (résolue dans le dossier prisma/)
SESSION_SECRET="..."                # secret de signature des sessions (à changer en prod)
OLLAMA_URL="http://127.0.0.1:11434" # IA locale (optionnelle)
OLLAMA_MODEL="gemma3:4b"            # modèle Ollama utilisé
```

> En production, remplacez impérativement `SESSION_SECRET` par une valeur longue et aléatoire.

## 7. Base SQL, migrations et seed

```bash
# 1. Appliquer le schéma à la base (crée prisma/dev.db)
npm run db:migrate      # (ou, sans invite : npx prisma migrate deploy)

# 2. Générer le client Prisma
npm run db:generate

# 3. Générer les QR codes de démonstration (fichiers fixes)
npm run qrcodes

# 4. Charger les données de départ (comptes, appareils, recommandations, profils démo…)
npm run db:seed
```

Raccourci tout-en-un (migrations + client + QR codes + seed) :

```bash
npm run setup
```

## 8. Lancer le projet

Commande recommandée sous Windows, avec vérification d'Ollama, du modèle local, de Prisma, de la base SQLite, des QR codes et du port disponible :

```powershell
cd "C:\Users\maman\Documents\energy-coach"
powershell -ExecutionPolicy Bypass -File .\start-complet.ps1
```

Si le port `3000` est déjà occupé, le script utilise automatiquement le port libre suivant (`3001`, `3002`, etc.).

Pour forcer une reconstruction du build :

```powershell
powershell -ExecutionPolicy Bypass -File .\start-complet.ps1 -Rebuild
```

Pour un lancement en mode développement :

```powershell
powershell -ExecutionPolicy Bypass -File .\start-complet.ps1 -Dev
```

Commande manuelle de développement :

```bash
npm run dev
```

Puis ouvrez http://localhost:3000

Pour un build de production :

```bash
npm run build
npm start
```

## 9. Comptes de test

| Rôle  | Email                      | Mot de passe |
| ----- | -------------------------- | ------------ |
| Admin | `admin@energycoach.local`  | `Admin1234!` |
| Démo  | `demo@energycoach.local`   | `Demo1234!`  |

Vous pouvez aussi créer un compte via la page **Inscription**.

## 10. Mode démo et scénario de démonstration

Depuis la page d'accueil (ou `/mode-demo`), le bouton **« Tester le mode démo »** :

1. recharge le compte démo (`demo@energycoach.local`) ;
2. applique un profil fictif (logement, appareils, habitudes, compteur simulé) ;
3. ouvre une **session authentifiée** (le mode démo ne contourne pas l'authentification) ;
4. affiche le tableau de bord complet avec un bandeau « Mode démo activé — les données affichées sont fictives ».

Scénario conseillé pour une présentation :

1. Accueil → « Tester le mode démo ».
2. Tableau de bord → profil complété à 100 %.
3. Diagnostic → résumé, score, 3 priorités, avant/après.
4. Recommandations → « Voir le calcul » sur une action.
5. Graphiques → répartition, avant/après, économies.
6. Plan d'action → cocher quelques actions, la progression se met à jour.
7. Se déconnecter puis se reconnecter → les données sont retrouvées.

## 11. QR codes de démonstration (fixes)

Les QR codes **ne sont jamais générés dynamiquement** dans l'application. Ce sont des fichiers statiques du projet, stockés dans :

```text
public/qrcodes/demo-linky-001.png
public/qrcodes/demo-gazpar-001.png
public/qrcodes/demo-prepaid-001.png
```

Contenus (payloads) reconnus :

```text
energycoach://connect-meter?type=linky&meterId=demo-linky-001
energycoach://connect-meter?type=gazpar&meterId=demo-gazpar-001
energycoach://connect-meter?type=prepaid&meterId=demo-prepaid-001
```

Le scanner (`/scan-qr`) vérifie que le contenu commence par `energycoach://connect-meter`, que le type est autorisé et que l'identifiant existe en base, puis charge les données de démonstration. Tout autre QR code (URL externe, texte quelconque) est **refusé** avec un message clair.

L'espace admin (`/admin/qr-codes`) permet uniquement de **consulter** ces QR codes existants (aucun bouton de génération).

## 12. IA locale (Ollama) et repli

Si Ollama est disponible (`OLLAMA_URL`), Energy Coach lui demande un court texte de coaching à partir des **chiffres déjà calculés par le système**. L'IA n'invente aucun chiffre, prix, source ni coefficient.

Installer et lancer un modèle :

```bash
ollama pull gemma3:4b
ollama serve
```

Dans l'analyse, Ollama peut sélectionner et prioriser des recommandations déjà calculées, puis rédiger une courte raison personnalisée. Les montants, scores, coefficients et économies restent calculés par le moteur interne de l'application.

**Sans Ollama, l'application fonctionne normalement** : les recommandations sont produites par le moteur de règles et un texte de repli est généré à partir des résultats calculés. Aucun message technique n'est affiché à l'utilisateur.

## 13. Limites assumées de la version finale

Cette version **ne fait pas** : connexion réelle Enedis/GRDF, récupération réelle Linky/Gazpar, solaire, batteries, coupures, délestage, groupe électrogène, génération dynamique de QR codes, promesse d'économie garantie.

Cette version **fait** : comptes utilisateurs, base SQL persistante, mode manuel, simulation compteur par QR fixe, calculs transparents, recommandations personnalisées, IA locale optionnelle avec repli, graphiques, plan d'action, admin, mode démo complet.

L'édition fine des profils démo (JSON) reste volontairement limitée côté admin : la principale action disponible est la **réinitialisation** du compte démo.

## 14. Améliorations futures

- Connexion réelle Enedis (Linky) et GRDF (Gazpar) avec consentement.
- Historique de consommation multi-périodes et suivi dans le temps.
- Migration vers PostgreSQL (l'architecture Prisma est déjà compatible).
- Personnalisation avancée des profils démo depuis l'admin.

## 15. Commandes utiles

| Commande             | Description                                    |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Lancer le serveur de développement             |
| `npm run build`      | Build de production                            |
| `npm start`          | Lancer le build de production                  |
| `npm run db:migrate` | Appliquer/mettre à jour le schéma de la base   |
| `npm run db:seed`    | Charger les données de départ                  |
| `npm run qrcodes`    | (Re)générer les QR codes fixes de démo         |
| `npm run setup`      | Migrations + client + QR codes + seed          |
| `npm run lint`       | Vérifier le code                               |
| `.\start-complet.ps1` | Démarrage local complet avec Ollama            |

---

> Les économies affichées dans l'application sont des **estimations**. Elles peuvent varier selon l'usage réel, la météo, le logement et le prix de l'énergie.
