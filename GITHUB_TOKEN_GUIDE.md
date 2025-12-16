# GitHub Personal Access Token - Schritt für Schritt

## Direktlink (funktioniert nur wenn du eingeloggt bist):

https://github.com/settings/tokens

## Manueller Weg:

1. **Gehe zu GitHub.com** und logge dich ein

2. **Klicke oben rechts auf dein Profilbild**

3. **Klicke auf "Settings"** (ganz unten im Dropdown-Menü)

4. **In der linken Seitenleiste** - scrolle ganz nach unten

5. **Du siehst "Access"** - darunter steht **"Developer settings"** → klicke darauf

6. **Links siehst du "Personal access tokens"** → klicke darauf

7. **Wähle "Tokens (classic)"** (nicht "Fine-grained tokens")

8. **Klicke auf den grünen Button "Generate new token"** → dann "Generate new token (classic)"

## Jetzt musst du ausfüllen:

1. **Note** (Name): z.B. `betfriends-deployment`

2. **Expiration**: 
   - Wähle z.B. "90 days" oder "No expiration" (wenn du willst)

3. **Select scopes** (Berechtigungen):
   - Aktiviere **`repo`** - das aktiviert automatisch alle Unterpunkte:
     - repo:status
     - repo_deployment
     - public_repo
     - repo:invite
     - security_events

4. **Ganz unten auf "Generate token" klicken**

5. **WICHTIG:** GitHub zeigt dir jetzt den Token nur EINMAL an!
   - Er sieht aus wie: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **KOPIERE IHN SOFORT!** (kannst ihn z.B. in einen TextEditor kopieren)

## Wenn du den Token verloren hast:

Du musst einen neuen erstellen, denn alte Tokens werden nicht nochmal angezeigt.

