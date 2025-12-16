# Einfach auf Vercel deployen (ohne GitHub!)

## Option 1: Mit Vercel CLI (EINFACHSTE Methode)

### Schritt 1: Vercel CLI installieren

```bash
npm install -g vercel
```

### Schritt 2: Vercel Account erstellen

1. Gehe zu https://vercel.com
2. Erstelle einen Account (kostenlos)

### Schritt 3: Deploy!

Im Terminal (im Projektordner):

```bash
cd /Users/tim2000isc/Desktop/CodingProjects/betfriends
vercel
```

Vercel fragt dich:
- **Set up and deploy?** → `Y`
- **Which scope?** → Dein Account
- **Link to existing project?** → `N` (neues Projekt)
- **Project name?** → `betfriends` (oder einfach Enter)
- **Directory?** → `.` (Enter drücken)
- **Override settings?** → `N`

**WICHTIG:** Dann musst du die Environment Variables setzen!

### Schritt 4: Environment Variables setzen

Nach dem ersten Deploy, oder während dem Deploy wenn gefragt:

Vercel fragt nach Environment Variables. Gib ein:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Oder später im Vercel Dashboard:**
1. Gehe zu https://vercel.com/dashboard
2. Klicke auf dein Projekt
3. Settings → Environment Variables
4. Füge die beiden Variablen hinzu
5. Klicke "Redeploy"

### Schritt 5: Supabase Redirect URL

In Supabase Dashboard → Authentication → URL Configuration:

Füge hinzu:
```
https://betfriends.vercel.app/auth/callback
```
(Die genaue URL zeigt dir Vercel nach dem Deploy)

Fertig! 🎉

---

## Option 2: Mit GitHub (für automatische Updates)

Falls du später automatische Deployments willst (jeder `git push` deployed automatisch):

1. Erstelle ein GitHub Repository (kannst du auch später machen)
2. In Vercel Dashboard → "Import Project" → Wähle GitHub Repository
3. Vercel verbindet sich automatisch mit GitHub

Aber für jetzt: **Option 1 ist viel einfacher!**

