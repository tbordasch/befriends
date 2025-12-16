# Deployment Guide - BetFriends auf Vercel

## Voraussetzungen

1. GitHub Account
2. Vercel Account (kostenlos: https://vercel.com)
3. Supabase Project bereits erstellt und konfiguriert

## Schritt 1: Projekt auf GitHub pushen

### 1.1 Alle Änderungen committen

```bash
# Status prüfen
git status

# Alle Dateien hinzufügen (außer .env-Dateien)
git add .

# Commit erstellen
git commit -m "Ready for deployment"

# Falls noch kein Remote existiert, erstelle ein neues Repository auf GitHub und dann:
# git remote add origin https://github.com/DEIN_USERNAME/betfriends.git

# Code pushen
git push -u origin main
```

### 1.2 GitHub Repository erstellen (falls noch nicht vorhanden)

1. Gehe zu https://github.com/new
2. Repository Name: `betfriends` (oder wie du willst)
3. **NICHT** "Initialize with README" ankreuzen (falls du schon lokale Dateien hast)
4. Klicke auf "Create repository"
5. Folge den Anweisungen zum Pushen deines Codes

## Schritt 2: Vercel Deployment

### 2.1 Projekt zu Vercel hinzufügen

1. Gehe zu https://vercel.com
2. Logge dich ein (kannst dich mit GitHub Account anmelden)
3. Klicke auf "Add New Project"
4. Wähle dein GitHub Repository aus (betfriends)
5. Klicke auf "Import"

### 2.2 Environment Variables setzen

**WICHTIG:** Du musst diese Umgebungsvariablen in Vercel setzen!

In Vercel:
1. Gehe zu deinem Projekt → Settings → Environment Variables
2. Füge folgende Variablen hinzu:

#### Supabase Environment Variables

Du findest diese Werte in deinem Supabase Dashboard unter Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**WICHTIG:** Verwende den **anon/public** Key, NICHT den service_role Key!

#### Optional: App URL

Falls du Custom Domains verwendest:

```
NEXT_PUBLIC_APP_URL=https://deine-domain.com
```

Wenn nicht gesetzt, wird automatisch `http://localhost:3000` verwendet (für lokale Entwicklung).

### 2.3 Build Settings

Vercel sollte automatisch erkennen:
- **Framework Preset:** Next.js
- **Build Command:** `next build` (automatisch)
- **Output Directory:** `.next` (automatisch)
- **Install Command:** `npm install` (automatisch)

### 2.4 Deploy

1. Klicke auf "Deploy"
2. Warte bis der Build fertig ist (ca. 2-3 Minuten)
3. Deine App ist live! 🎉

## Schritt 3: Supabase Konfiguration anpassen

### 3.1 Redirect URLs in Supabase setzen

In deinem Supabase Dashboard:
1. Gehe zu Authentication → URL Configuration
2. Füge deine Vercel URL zur "Redirect URLs" Liste hinzu:
   - `https://dein-projekt.vercel.app/auth/callback`
   - Falls du eine Custom Domain hast: `https://deine-domain.com/auth/callback`

### 3.2 CORS Settings (falls nötig)

In Supabase Dashboard → Settings → API:
- Stelle sicher, dass deine Vercel Domain in den erlaubten Domains ist

## Schritt 4: Testen

1. Öffne deine Vercel URL
2. Teste die Anmeldung
3. Teste alle Funktionen

## Wichtige Hinweise

### ✅ Was NICHT committed werden sollte

- `.env.local` oder `.env` Dateien (sind bereits in `.gitignore`)
- `node_modules/` (bereits in `.gitignore`)
- Supabase Keys sollten nur in Vercel Environment Variables gesetzt werden

### 🔒 Sicherheit

- **NIEMALS** den `service_role` Key in Environment Variables setzen!
- Nur `anon/public` Key verwenden
- Der `service_role` Key sollte nur in Server-Side Code verwendet werden (wird bereits korrekt gemacht)

### 🔄 Updates deployen

Nach jedem `git push` zu GitHub wird automatisch ein neuer Build auf Vercel erstellt!

```bash
git add .
git commit -m "Your changes"
git push
```

## Troubleshooting

### Build Fehler

- Prüfe ob alle Environment Variables in Vercel gesetzt sind
- Prüfe die Build Logs in Vercel für detaillierte Fehlermeldungen

### Authentication funktioniert nicht

- Prüfe ob Redirect URLs in Supabase korrekt gesetzt sind
- Prüfe ob Supabase URL und Anon Key korrekt in Vercel gesetzt sind

### Datenbank Fehler

- Stelle sicher, dass `MASTER_SETUP.sql` in Supabase ausgeführt wurde
- Prüfe ob RLS Policies korrekt gesetzt sind


