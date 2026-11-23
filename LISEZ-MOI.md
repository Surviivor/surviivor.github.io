# Mettre Survivor en ligne (gratuit, sans coder)

Compte environ 20 minutes. Tu vas utiliser deux services gratuits :

- **Firebase** (Google) : les comptes de tes copains et la base de données (ligues, choix, profils).
- **GitHub** : l'hébergement du site et la mise à jour automatique des matchs, résultats et classements, deux fois par jour.

À la fin, ton site aura une adresse du type `https://ton-pseudo.github.io/survivor/` à envoyer à tes copains.

---

## Étape 1 — Créer le projet Firebase

1. Va sur **https://console.firebase.google.com** et connecte-toi avec ton compte Google.
2. Clique sur **Créer un projet**, nomme-le `survivor`, puis clique sur **Continuer**. Tu peux désactiver Google Analytics. Clique sur **Créer le projet**.
3. Laisse le forfait **Spark** (gratuit). Aucune carte bancaire n'est demandée.

## Étape 2 — Récupérer la configuration

1. Sur la page d'accueil du projet, clique sur l'icône **`</>`** (« Web »).
2. Surnom de l'application : `survivor`. Ne coche **pas** Firebase Hosting. Clique sur **Enregistrer l'application**.
3. Firebase affiche un bloc de code avec `const firebaseConfig = { ... }`. Garde cette page ouverte : tu copieras les valeurs `apiKey`, `authDomain`, `projectId` et `appId` à l'étape 5.

## Étape 3 — Activer la connexion

1. Menu de gauche **Créer → Authentication**, puis **Commencer**.
2. Onglet **Mode de connexion** :
   - **Google** → Activer → choisis ton e-mail d'assistance → Enregistrer.
   - **Adresse e-mail/Mot de passe** → Activer (la première case seulement) → Enregistrer.

## Étape 4 — Créer la base de données

1. Menu de gauche **Créer → Firestore Database**, puis **Créer une base de données**.
2. Emplacement : **eur3 (Europe)**. Choisis **Démarrer en mode production**, puis **Créer**.
3. Onglet **Règles** : efface tout, colle le contenu du fichier **`firestore.rules`**, puis clique sur **Publier**.
   - Si l'administrateur n'est pas `remy.wannebroucq@gmail.com`, change l'adresse dans ce fichier (et à l'étape 5).

## Étape 5 — Mettre le site sur GitHub

1. Crée un compte sur **https://github.com** si tu n'en as pas.
2. En haut à droite, **+ → New repository**. Nom : `survivor`. Choisis **Public** (obligatoire pour l'hébergement gratuit). Clique sur **Create repository**.
3. Sur la page du dépôt vide, clique sur le lien **uploading an existing file**.
4. Dézippe `survivor-a-heberger.zip` sur ton ordinateur. Ouvre le dossier, sélectionne **tout son contenu** (y compris le dossier caché `.github`, voir l'astuce plus bas) et glisse-le dans la page. Clique sur **Commit changes**.
5. Dans le dépôt, ouvre le fichier **`firebase-config.js`**, clique sur le crayon ✏️ et remplace chaque `COLLE-ICI` par les valeurs de l'étape 2. Clique sur **Commit changes**.

> **Astuce dossier caché (Mac)** : dans le Finder, appuie sur **Cmd + Maj + .** pour afficher le dossier `.github`. S'il n'est pas envoyé, crée-le à la main sur GitHub : **Add file → Create new file**, tape `.github/workflows/update-data.yml` comme nom, puis colle le contenu du fichier.

## Étape 6 — Activer l'hébergement et la mise à jour automatique

1. Dans le dépôt : **Settings → Pages**. Sous « Branch », choisis **main** et **/ (root)**, puis **Save**. Après une à deux minutes, l'adresse du site apparaît en haut de la page.
2. **Settings → Actions → General** : sous « Workflow permissions », coche **Read and write permissions**, puis **Save**.
3. Onglet **Actions** : si GitHub le demande, clique sur **I understand my workflows, go ahead and enable them**. Ouvre ensuite « Mise à jour des matchs et classements » et clique sur **Run workflow** pour un premier essai. Il prend 5 à 10 minutes.

## Étape 7 — Autoriser l'adresse du site dans Firebase

1. Firebase → **Authentication → Paramètres → Domaines autorisés → Ajouter un domaine**.
2. Ajoute `ton-pseudo.github.io` (sans `https://` ni `/survivor`).

## C'est prêt 🎉

Ouvre l'adresse du site sur ton téléphone. Connecte-toi avec Google en utilisant l'e-mail administrateur : tu verras l'onglet **ADMIN**. Crée ta première ligue, puis envoie l'adresse et le code de la ligue à tes copains.

Sur iPhone : dans Safari, **Partager → Sur l'écran d'accueil** pour l'avoir comme une appli.

---

## Bon à savoir

- **Gratuit** : le forfait Spark de Firebase suffit largement pour un groupe d'amis (50 000 lectures par jour). GitHub Pages et les Actions sont gratuits pour un dépôt public.
- **Heure limite** : le serveur refuse tout choix fait ou modifié après l'heure limite d'une journée, même en bidouillant le téléphone.
- **Photos** : elles sont réduites et stockées directement dans la base (pas de service de stockage payant).
- **Mise à jour des matchs** : deux fois par jour, automatiquement. Pour forcer une mise à jour : onglet **Actions → Run workflow**.
- **Les données de la version Claude** (ligues, joueurs, choix) ne sont pas transférées : la version hébergée démarre vide.
- **Ajouter un administrateur** : ajoute son e-mail dans `firebase-config.js` **et** dans les règles Firestore, puis publie les deux.
