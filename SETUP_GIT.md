# Git Installation und Setup für macOS

## Schritt 1: Git installieren

### Option A: Mit Homebrew (empfohlen, wenn du Homebrew hast)

```bash
# Prüfe ob Homebrew installiert ist
brew --version

# Falls Homebrew vorhanden ist, installiere Git:
brew install git
```

### Option B: Mit Xcode Command Line Tools (einfachste Methode)

```bash
# Öffne Terminal und führe aus:
xcode-select --install
```

Das öffnet ein Fenster. Klicke auf "Installieren" und warte (dauert ca. 5-10 Minuten).

### Option C: Git direkt von der Website

1. Gehe zu https://git-scm.com/download/mac
2. Lade die Installer-Datei herunter
3. Öffne die .dmg Datei und folge den Installationsanweisungen

## Schritt 2: Git konfigurieren

Nach der Installation öffne Terminal und führe aus:

```bash
# Deine Git-Identität konfigurieren (ersetze mit deinen Daten)
git config --global user.name "Dein Name"
git config --global user.email "deine.email@example.com"

# Prüfe ob es geklappt hat
git --version
git config --list
```

**WICHTIG:** Verwende die E-Mail-Adresse, die du für GitHub verwendest!

## Schritt 3: GitHub Account erstellen (falls noch nicht vorhanden)

1. Gehe zu https://github.com
2. Klicke auf "Sign up"
3. Folge den Anweisungen

## Schritt 4: GitHub Repository erstellen

1. Nach dem Login auf GitHub, klicke oben rechts auf dein Profil-Icon → "Your repositories"
2. Klicke auf "New" (grüner Button)
3. Repository Name: `betfriends`
4. Beschreibung (optional): "Social Betting App"
5. **WICHTIG:** Wähle "Private" oder "Public" (deine Wahl)
6. **NICHT** "Add a README file", "Add .gitignore", oder "Choose a license" ankreuzen
7. Klicke auf "Create repository"

## Schritt 5: Code committen und pushen

Jetzt zurück zum Terminal. Navigiere zu deinem Projekt und führe aus:

```bash
# Zum Projektordner navigieren (falls noch nicht dort)
cd /Users/tim2000isc/Desktop/CodingProjects/betfriends

# Git Repository initialisieren (falls noch nicht geschehen)
git init

# Status prüfen
git status

# Alle Dateien hinzufügen
git add .

# Ersten Commit erstellen
git commit -m "Initial commit - Ready for deployment"

# GitHub Repository als Remote hinzufügen (ersetze DEIN_USERNAME)
git remote add origin https://github.com/DEIN_USERNAME/betfriends.git

# Branch auf main umbenennen (falls nötig)
git branch -M main

# Code zu GitHub pushen
git push -u origin main
```

Bei `git push` wirst du nach deinem GitHub Username und Password gefragt.

**WICHTIG für Passwort:**
- GitHub akzeptiert keine normalen Passwörter mehr
- Du musst ein "Personal Access Token" erstellen (siehe Schritt 6)

## Schritt 6: Personal Access Token erstellen (für Git Push)

1. Gehe zu GitHub → Settings (oben rechts auf dein Profil → Settings)
2. Scrolle runter zu "Developer settings" (ganz unten links)
3. Klicke auf "Personal access tokens" → "Tokens (classic)"
4. Klicke auf "Generate new token" → "Generate new token (classic)"
5. Gib einen Namen ein (z.B. "betfriends-deployment")
6. Wähle Ablaufzeit (z.B. "No expiration" oder "90 days")
7. Wähle Berechtigungen: Aktiviere mindestens `repo` (alle Unterpunkte)
8. Klicke auf "Generate token"
9. **WICHTIG:** Kopiere den Token sofort! Er wird nur einmal angezeigt.

Wenn du `git push` ausführst, verwende:
- **Username:** Dein GitHub Username
- **Password:** Den Personal Access Token (nicht dein GitHub Passwort!)

## Schritt 7: Vercel Deployment

Nach erfolgreichem Push zu GitHub:

1. Gehe zu https://vercel.com
2. Klicke auf "Sign Up" (kannst dich mit GitHub Account anmelden)
3. Nach dem Login: "Add New Project"
4. Wähle dein `betfriends` Repository aus
5. Klicke auf "Import"

### Environment Variables setzen:

In Vercel Projekt → Settings → Environment Variables:

Füge hinzu:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Diese findest du in Supabase Dashboard → Settings → API

### Supabase Redirect URL:

In Supabase Dashboard → Authentication → URL Configuration:

Füge hinzu:
```
https://dein-projekt.vercel.app/auth/callback
```

6. Klicke auf "Deploy"

Fertig! 🎉

