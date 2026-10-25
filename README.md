# NotFollow

Find out who doesn't follow you back on Instagram, TikTok, X, and GitHub.

**Use it here:** https://notfollow.pages.dev

## How to use

### Instagram

1. In the Instagram app, open **Accounts Center → Your information and permissions → Download your information**.
2. Choose **Some of your information → Followers and following**, then **Download to device** with format **JSON** and date range **All time**.
3. Wait for Instagram's email (it can take a few hours), download the ZIP and unzip it.
4. On NotFollow, upload `followers_1.json` (and any other `followers_*.json`) and `following.json`.
5. Click **Check Non-Followers**.

### TikTok

1. In TikTok, open **Settings and privacy → Account → Download your data**, pick **JSON** and request it.
2. Upload `user_data_tiktok.json` (or `user_data.json`) and click **Check Non-Followers**.

### X (Twitter)

1. In X, open **Settings → Your account → Download an archive of your data** and wait for the email.
2. Unzip it, upload `follower.js` and `following.js`, and click **Check Non-Followers**.
3. X's archive has no usernames, so the list shows account IDs; each one still links to the profile.

### GitHub

Type any GitHub username and click **Check Non-Followers**. No file needed.

## Good to know

- **"Sorry, this page isn't available" on Instagram.** Usually the account was deactivated, deleted, or renamed. Deactivated accounts also disappear from your followers file, so they show up here even if they followed you. Click **Check status**, then **Hide unavailable** to remove them from the list.
- **Opening profiles faster.** Pick 5 or 10 and click **Open next tabs**. Your browser opens only one tab per click until you allow pop-ups for the site (icon in the address bar). Opening lots of profiles very quickly can make Instagram show "page isn't available" for a while, so take it in small batches.
- **Hide.** Hidden accounts stay hidden on your device next time you check. **Reset hidden** brings them back.

## Privacy

Your files are read in your browser and never uploaded. The only things sent anywhere:

- **GitHub:** the username you type, to GitHub's public API.
- **Instagram "Check status":** the usernames being checked, to this site's server, which asks Instagram whether each profile exists. Nothing is stored.

## For developers

Built with [Astro](https://astro.build) and Tailwind CSS. Hosted on Cloudflare Pages.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```

The Instagram status check is a Cloudflare Pages Function in `functions/api/ig-status.ts`, so it doesn't run under `npm run dev`. To try it locally: `npm run build && npx wrangler pages dev dist`.

Cloudflare Pages settings: build command `npm run build`, output directory `dist`.

## License

[AGPL-3.0](LICENSE)
