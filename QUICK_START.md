# Quick Start - Deployment auf Vercel

Git ist bereits installiert! ✅

## Schritt 1: Git konfigurieren (nur einmalig)

Öffne Terminal und führe aus (ersetze mit deinen Daten):

```bash
git config --global user.name "Dein Name"
git config --global user.email "deine.email@example.com"
```

**WICHTIG:** Verwende die E-Mail, die du für GitHub verwendest!

## Schritt 2: GitHub Account & Repository

1. Gehe zu https://github.com und erstelle einen Account (oder logge dich ein)

2. Erstelle ein neues Repository:
   - Klicke auf dein Profil (oben rechts) → "Your repositories"
   - Klicke auf "New" (grüner Button)
   - Name: `betfriends`
   - Wähle "Private" oder "Public"
   - **NICHT** "Add a README file" ankreuzen!
   - Klicke auf "Create repository"

3. GitHub zeigt dir dann eine URL wie: `https://github.com/DEIN_USERNAME/betfriends.git`
   - **Kopiere diese URL** - du brauchst sie gleich!

## Schritt 3: Personal Access Token erstellen (für Git Push)

GitHub braucht einen Token statt Passwort:

1. GitHub → Settings (Profil-Icon oben rechts → Settings)
2. Links: "Developer settings"
3. "Personal access tokens" → "Tokens (classic)"
4. "Generate new token" → "Generate new token (classic)"
5. Name: z.B. "betfriends-token"
6. Ablauf: z.B. "90 days" oder "No expiration"
7. Aktiviere `repo` (alle Unterpunkte)
8. Klicke "Generate token"
9. **KOPIERE DEN TOKEN SOFORT!** (wird nur einmal angezeigt)

## Schritt 4: Code zu GitHub pushen

Führe im Terminal aus (im Projektordner):

```bash
cd /Users/tim2000isc/Desktop/CodingProjects/betfriends

# Alle Änderungen hinzufügen
git add .

# Commit erstellen
git commit -m "Initial commit - Ready for Vercel deployment"

# GitHub Repository verbinden (ersetze DEIN_USERNAME mit deinem GitHub Username)
git remote add origin https://github.com/DEIN_USERNAME/betfriends.git

# Code pushen
git push -u origin main
```

Bei `git push` wird gefragt:
- **Username:** Dein GitHub Username
- **Password:** Der Token aus Schritt 3 (nicht dein GitHub Passwort!)

## Schritt 5: Vercel Deployment

1. Gehe zu https://vercel.com
2. Sign Up (kannst dich mit GitHub anmelden)
3. "Add New Project"
4. Wähle dein `betfriends` Repository
5. Klicke "Import"

### Environment Variables (WICHTIG!):

In Vercel: Projekt → Settings → Environment Variables

Füge hinzu:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Diese findest du in: Supabase Dashboard → Settings → API

### Supabase Redirect URL:

In Supabase Dashboard → Authentication → URL Configuration

Füge hinzu (nach dem Deploy, wenn du die Vercel URL hast):
```
https://dein-projekt.vercel.app/auth/callback
```

6. Klicke "Deploy"

Fertig! 🎉


