# Neues Supabase Projekt Setup (Neue Organisation)

## Schritt 1: Neue Organisation erstellen

1. Gehe zu https://supabase.com/dashboard
2. Klicke auf dein Profil (oben rechts)
3. Klicke auf **"New Organization"** (oder "Create Organization")
4. **Organisation Details:**
   - **Name:** Wähle einen Namen für die Organisation (z.B. "BetFriends" oder "MyBetApp")
   - **Optional:** Setze ein Organisation-Logo/Icon
5. Klicke auf **"Create Organization"**

## Schritt 2: Neues Projekt in der neuen Organisation erstellen

1. Stelle sicher, dass du in der neuen Organisation bist (oben links sollte der neue Name stehen)
2. Klicke auf **"New Project"**
3. **Wichtige Einstellungen:**
   - **Name:** Wähle einen Projektnamen (z.B. "betfriends" oder "production")
   - **Database Password:** Notiere dir das Passwort sicher (du brauchst es später nicht, aber sicher ist sicher)
   - **Region:** Wähle eine Region in deiner Nähe
   - **Pricing Plan:** Free tier ist für den Start ok
4. Klicke auf **"Create new project"**
5. Warte bis das Projekt vollständig initialisiert ist (1-2 Minuten)

## Schritt 3: Neue Projekt-Keys holen

Nachdem das Projekt erstellt wurde:

1. Gehe zu **Project Settings** → **API**
2. Kopiere folgende Werte:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **anon/public key** (für NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role key** (für SUPABASE_SERVICE_ROLE_KEY - NUR für Server-Side, nie im Frontend!)

## Schritt 4: .env.local Datei aktualisieren

Öffne `.env.local` (oder `.env`) und ersetze die alten Werte:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=deine_neue_anon_key
SUPABASE_SERVICE_ROLE_KEY=deine_neue_service_role_key
```

## Schritt 5: MASTER_SETUP.sql ausführen

1. Gehe zu **SQL Editor** im Supabase Dashboard
2. Öffne die Datei `supabase/MASTER_SETUP.sql`
3. Kopiere den **kompletten Inhalt**
4. Füge ihn in den SQL Editor ein
5. Klicke auf **Run** (oder Cmd+Enter)
6. Warte bis die Ausführung erfolgreich ist

## Schritt 6: Storage Bucket erstellen (für Proofs - optional)

Falls du Proofs hochladen willst:

1. Gehe zu **Storage** im Dashboard
2. Klicke auf **New bucket**
3. Name: `proofs`
4. **Public bucket:** EIN (ON)
5. Klicke auf **Create bucket**

**ODER** führe das SQL Script aus (siehe `PROOFS_STORAGE_POLICY.sql`)

## Schritt 7: Testen

1. Starte deinen Next.js Dev Server neu (`npm run dev`)
2. Gehe zu `/signup` und erstelle einen neuen Account
3. Du solltest automatisch 1000 Punkte haben
4. Teste eine Wette zu erstellen

## Wichtige Hinweise

- **NICHT** die alte Organisation/das alte Projekt löschen bevor du die neuen Keys hast!
- Eine neue Organisation bedeutet komplett neue Keys - alles ist getrennt
- Das neue Projekt ist komplett leer - alle Tabellen werden durch MASTER_SETUP.sql erstellt
- User Accounts müssen neu erstellt werden (signup)
- Alle Daten aus dem alten Projekt sind weg (das ist gewollt)

## Checkliste

- [ ] Neue Organisation erstellt
- [ ] Neues Projekt in der Organisation erstellt
- [ ] Neue Keys kopiert
- [ ] .env.local aktualisiert
- [ ] MASTER_SETUP.sql ausgeführt (ohne Fehler)
- [ ] Next.js Server neu gestartet
- [ ] Test-Account erstellt
- [ ] Wette erstellt (funktioniert?)

## Wenn etwas schief geht

Falls MASTER_SETUP.sql einen Fehler wirft:
- Prüfe die Fehlermeldung
- Möglicherweise musst du `CLEAN_SLATE_EXCEPT_AUTH.sql` zuerst ausführen (aber bei einem neuen Projekt ist das nicht nötig - es ist ja leer)

