# Projekt auf GitHub hochladen (EINFACH - ohne Git!)

## Methode 1: GitHub Web-Oberfläche (EINFACHSTE!)

### Schritt 1: GitHub Repository erstellen

1. Gehe zu https://github.com
2. Logge dich ein (oder erstelle Account)
3. Klicke auf dein Profilbild (oben rechts) → "Your repositories"
4. Klicke auf "New" (grüner Button)
5. Repository Name: `betfriends`
6. Wähle "Private" oder "Public"
7. **WICHTIG:** Klicke NICHT auf "Add a README file"
8. Klicke auf "Create repository"

### Schritt 2: Dateien hochladen

GitHub zeigt dir dann eine Seite mit "Quick setup". Aber wir machen es anders:

1. **Klicke auf "uploading an existing file"** (Link ganz oben auf der Seite)

2. **Oder:** Gehe direkt zu: `https://github.com/DEIN_USERNAME/betfriends/upload/main`

3. **Ziehe deinen Projektordner rein:**
   - Öffne Finder
   - Gehe zu `/Users/tim2000isc/Desktop/CodingProjects/betfriends`
   - **WICHTIG:** Ziehe NICHT den ganzen Ordner, sondern wähle ALLE Dateien aus (Cmd+A)
   - Ziehe sie in das GitHub Upload-Fenster

4. **Scroll runter** und klicke auf "Commit changes"

Fertig! Dein Code ist auf GitHub! 🎉

---

## Methode 2: Mit Git (wenn du willst)

Falls du Git verwenden willst (später für Updates einfacher):

```bash
cd /Users/tim2000isc/Desktop/CodingProjects/betfriends

# Git initialisieren (falls noch nicht geschehen)
git init

# Alle Dateien hinzufügen
git add .

# Commit erstellen
git commit -m "Initial commit"

# GitHub Repository verbinden (ersetze DEIN_USERNAME)
git remote add origin https://github.com/DEIN_USERNAME/betfriends.git

# Branch auf main setzen
git branch -M main

# Code pushen (du wirst nach Username/Password gefragt)
git push -u origin main
```

**Für Password:** GitHub braucht einen Personal Access Token (nicht dein normales Passwort).

---

## Dann in Vercel:

1. Gehe zu https://vercel.com
2. Sign Up / Login (kannst dich mit GitHub anmelden - dann ist es noch einfacher!)
3. Klicke "Add New Project"
4. Wähle dein `betfriends` Repository
5. Klicke "Import"
6. Setze Environment Variables (siehe unten)
7. Klicke "Deploy"

### Environment Variables in Vercel:

Projekt → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase Redirect URL:

Supabase Dashboard → Authentication → URL Configuration:

```
https://betfriends.vercel.app/auth/callback
```
(Wird dir nach dem Deploy von Vercel angezeigt)

Fertig! 🎉


