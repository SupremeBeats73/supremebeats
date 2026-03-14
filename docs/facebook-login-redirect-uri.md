# Facebook Login – Redirect URI & Data Deletion Callback

## Data Deletion Callback URL (required for Facebook Login)

Meta requires a **Data Deletion Request Callback** URL so that when a user removes your app and requests data deletion, Meta can notify your server.

**Callback URL to register in Meta:**  
`https://www.supremebeatsstudio.com/api/webhooks/facebook-data-deletion`  
(Use your actual site domain from `NEXT_PUBLIC_SITE_URL`.)

**Where to set it:**  
Meta App Dashboard → **App Settings** → **Basic** → **Data Deletion Request URL** (or **User data deletion**). Paste the URL above and save.

**Environment variable:**  
Add your Facebook app secret so the callback can verify requests:

- `FACEBOOK_APP_SECRET=your_app_secret`  
  or  
- `META_APP_SECRET=your_app_secret`

(App secret is in Meta App Dashboard → App Settings → Basic → App Secret.)

The callback deletes the Supabase Auth user (and thus linked profile data) for the Facebook user who requested deletion, and returns a confirmation code and a status URL (`/privacy#data-deletion`).

---

## Valid OAuth Redirect URI (fix “Invalid redirect URI”)

Facebook must allow the **exact** URL Supabase uses for the OAuth callback. Add this in your Facebook app:

**URI to add:**  
`https://rpdsusbghxytanfmjofb.supabase.co/auth/v1/callback`

---

## Where to add it (Meta / Facebook app)

The setting has different names and locations depending on the dashboard version.

### Option A – “Use cases” (newer dashboard)

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) and open your app.
2. In the **left sidebar**, click **Use cases** (or the pencil/edit icon).
3. Find **“Authenticate and request data from users with Facebook Login”** (or similar) and open it.
4. In that use case, find **Settings** (or “Go to settings”).
5. Look for one of:
   - **Valid OAuth Redirect URIs**
   - **Redirect URI validator**
   - **Client OAuth Settings** (with a redirect URIs list)
6. Add:  
   `https://rpdsusbghxytanfmjofb.supabase.co/auth/v1/callback`  
   (one per line if it’s a list).
7. **Save**.

### Option B – “Products” → Facebook Login (older dashboard)

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) and open your app.
2. In the **left sidebar**, open **Products** (or **App settings**).
3. Under **Products**, click **Facebook Login** (or “Set up” if it’s not added yet).
4. Open **Facebook Login** → **Settings** (or **Configuration**).
5. Find **Client OAuth Settings** and then **Valid OAuth Redirect URIs** (or “Redirect URI”).
6. Add:  
   `https://rpdsusbghxytanfmjofb.supabase.co/auth/v1/callback`  
   and **Save**.

### Option C – App Dashboard “Settings”

1. In the app dashboard, go to **Settings** (gear icon or “App settings”).
2. Open **Basic** or **Advanced** and look for **Facebook Login** or **OAuth**.
3. Find **Valid OAuth Redirect URIs** / **Redirect URI** and add the URL above, then save.

---

## Checklist

- [ ] No trailing slash: use `.../auth/v1/callback` not `.../auth/v1/callback/`
- [ ] `https` (not `http`) for production
- [ ] You clicked **Save** after adding the URI
- [ ] If “Strict Mode” or “Enforce redirect URI” is on, the URI must match exactly (no extra query params in the value you add)

---

## If you still don’t see “Valid OAuth Redirect URIs”

1. **Add the Facebook Login product**  
   If “Facebook Login” isn’t in your app yet:  
   Dashboard → **Add product** → **Facebook Login** → **Set up**. Then open **Facebook Login** → **Settings**.

2. **Use “Customize” for the Login use case**  
   Under **Use cases** → Facebook Login use case, use **Customize** or **Settings** and scroll; the redirect field is often below other OAuth options.

3. **App mode**  
   Some redirect/OAuth options only appear when the app is in **Development** or **Live**. Try switching mode and recheck Settings.

4. **Direct link (if your app ID is in the URL)**  
   Sometimes you can open Login settings directly:  
   `https://developers.facebook.com/apps/YOUR_APP_ID/fb-login/settings/`  
   Replace `YOUR_APP_ID` with your app’s numeric ID (from Dashboard → Settings → Basic → App ID).

After adding the Supabase callback URL and saving, try Facebook login again on your site.
