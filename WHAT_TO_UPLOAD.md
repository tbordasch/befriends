# Was muss auf GitHub hochgeladen werden?

## ✅ MUSS hochgeladen werden (wird automatisch mit Git gemacht):

### Wichtige Ordner:
- ✅ `src/` - Dein gesamter Code
- ✅ `public/` - Statische Dateien (Bilder, etc.)
- ✅ `supabase/` - SQL-Dateien
- ✅ `src/components/` - Alle Komponenten
- ✅ `src/app/` - Alle Pages
- ✅ `src/lib/` - Utilities und Actions

### Wichtige Dateien:
- ✅ `package.json` - Dependencies
- ✅ `package-lock.json` - Dependency-Versionen (lock file)
- ✅ `tsconfig.json` - TypeScript Config
- ✅ `next.config.ts` - Next.js Config
- ✅ `tailwind.config.ts` oder ähnlich - Tailwind Config
- ✅ `middleware.ts` - Authentication Middleware
- ✅ `.gitignore` - Sagt Git, was ignoriert werden soll
- ✅ `README.md` - Projektbeschreibung (optional)
- ✅ `components.json` - shadcn/ui Config

## ❌ NICHT hochladen (wird automatisch von .gitignore ausgeschlossen):

### Große Ordner (werden automatisch erstellt):
- ❌ `node_modules/` - Wird automatisch mit `npm install` erstellt (zu groß!)
- ❌ `.next/` - Build-Ordner, wird bei Build erstellt
- ❌ `.vercel/` - Vercel Cache

### Sensitive Dateien (dürfen nie auf GitHub!):
- ❌ `.env.local` - Enthält deine Supabase Keys!
- ❌ `.env` - Enthält Secrets
- ❌ `*.env*` - Alle Environment-Dateien

### System-Dateien:
- ❌ `.DS_Store` - macOS System-Datei
- ❌ `*.log` - Log-Dateien

---

## Wenn du GitHub Web-Upload verwendest:

Wenn du die Dateien manuell hochlädst (drag & drop):

1. **Ziehe den GESAMTEN Ordner** in GitHub
2. GitHub respektiert die `.gitignore` Datei
3. Dateien in `.gitignore` werden automatisch ausgeschlossen
4. **ABER:** Sei vorsichtig - prüfe dass `.env.local` nicht dabei ist!

**Besser:** Verwende Git, dann wird automatisch nur das Richtige hochgeladen.

---

## Empfehlung: Git verwenden

Mit Git wird automatisch nur das Richtige hochgeladen (wegen `.gitignore`):

```bash
cd /Users/tim2000isc/Desktop/CodingProjects/betfriends

# Alle relevanten Dateien hinzufügen (node_modules wird automatisch ignoriert)
git add .

# Commit
git commit -m "Initial commit"

# Zu GitHub pushen
git remote add origin https://github.com/DEIN_USERNAME/betfriends.git
git branch -M main
git push -u origin main
```

---

## Wichtig: Environment Variables

Deine `.env.local` Datei wird **NICHT** auf GitHub hochgeladen (steht in `.gitignore`).

Die Environment Variables musst du dann in **Vercel** manuell setzen:

Vercel → Projekt → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Diese Werte findest du in deinem Supabase Dashboard → Settings → API.

