# Grace Fire Deliverance Healing Global World Ministry — Website

A complete church website: hero image slider, countdown to the 9th
Anniversary, weekly service times, about page, events page, gallery,
sermons, testimonies, prayer request form, contact form, Google map,
WhatsApp chat button, and a partnership/giving page with bank details.
Built with plain HTML/CSS/JS on the front end and a small Node.js
(Express) backend that saves your Prayer Request and Contact form
submissions — no cost, no database needed.

This guide assumes you have never deployed a website before. Follow it
in order.

---

## 1. What's inside

```
church-site/
├── server.js              ← the backend (saves form submissions)
├── package.json            ← tells Node which packages to install
├── data/
│   ├── prayers.json        ← prayer requests get saved here
│   └── contacts.json       ← contact messages get saved here
└── public/                 ← everything a visitor sees
    ├── index.html          ← Home page
    ├── about.html
    ├── events.html          ← anniversary flyer + countdown
    ├── gallery.html
    ├── sermons.html
    ├── contact.html         ← prayer request + contact form + map
    ├── partnership.html     ← bank account details
    ├── css/style.css
    ├── js/main.js
    └── images/              ← logo, pastor photos, church photo
```

---

## 2. Run it on your own computer first (test before publishing)

1. **Install Node.js** (one-time only): go to https://nodejs.org and
   download the "LTS" version for your operating system. Install it
   like any normal program.
2. **Unzip** the `church-site` folder you downloaded onto your Desktop.
3. Open a terminal / command prompt inside that folder:
   - Windows: open the `church-site` folder, click the address bar,
     type `cmd`, press Enter.
   - Mac: right-click the `church-site` folder → "New Terminal at Folder".
4. Type this and press Enter (only needed once, downloads the tools the
   server uses):
   ```
   npm install
   ```
5. Start the website:
   ```
   npm start
   ```
6. Open your browser and go to: **http://localhost:3000**
   You should see your church website! Try the Prayer Request form on
   the Contact page — after submitting, open
   `church-site/data/prayers.json` in Notepad to see it saved there.
7. To stop the server, go back to the terminal and press `Ctrl + C`.

---

## 3. Things you will want to personalize

All of these are plain text files — open them in Notepad, VS Code, or
any text editor, make your change, save, and refresh the browser.

| What to change | Where |
|---|---|
| Anniversary date/time for the countdown | `public/js/main.js` → find `countdownTarget` near the top |
| Phone number / WhatsApp number | Search-and-replace `2348054302247` in every `.html` file (this is 080-54-30-22-47 in international format) |
| Address | Search-and-replace the address text in every `.html` file |
| Bank account details | `public/partnership.html` |
| Sermon video links | `public/sermons.html` → replace the YouTube links |
| Photos | Add new files to `public/images/` then reference them (e.g. `<img src="/images/your-photo.jpg">`) |
| Google Map | Already set to Isheri Osun, Lagos. To pin your exact building: go to Google Maps, search your address, click "Share" → "Embed a map", copy the link inside `src="..."` and paste it into the `<iframe class="map-frame" ... src="...">` in `index.html` and `contact.html` |

### About the WhatsApp number format
Your number `080-54-30-22-47` is written in the site as `2348054302247`
— that is Nigeria's country code `234` + the number without the
leading `0`. This is the format WhatsApp links need
(`https://wa.me/2348054302247`).

---

## 4. Reading your Prayer Requests and Contact messages

While the server is running, open these links in your browser:
- `http://localhost:3000/admin/prayers` — every prayer request
- `http://localhost:3000/admin/contacts` — every contact message

**Important:** these admin pages are not password-protected in this
starter version. Once your site is live, do not share these links
publicly. If you want them properly secured (with a login), let me
know and I can add that next.

---

## 5. Deploy it online for free (so anyone can visit it)

We'll use **Render** — it has a free tier, and it can run your Node.js
backend (unlike some purely static hosts).

### Step A — Put your project on GitHub
1. Create a free account at https://github.com
2. Click the **+** icon (top right) → **New repository**. Name it
   `grace-fire-website`. Keep it Public. Click **Create repository**.
3. On the new repository page, click **uploading an existing file**
   and drag your entire `church-site` folder contents into it (all
   files and the `public`, `data` folders). Click **Commit changes**.

### Step B — Deploy on Render
1. Go to https://render.com and sign up for free (you can sign up with
   your GitHub account — this makes the next step easier).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select the `grace-fire-website`
   repository.
4. Fill in:
   - **Name:** grace-fire-deliverance
   - **Region:** choose the one closest to Nigeria (e.g. Frankfurt)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Click **Create Web Service**. Render will install everything and
   start your site. This takes 2–5 minutes.
6. When it's done, Render gives you a free web address like:
   `https://grace-fire-deliverance.onrender.com`
   That is your live website — share it with your members!

**Note on the free tier:** Render's free web services "sleep" after
15 minutes with no visitors, and take about 30–60 seconds to "wake up"
on the next visit. This is fine for a small church site and costs
nothing. If you later want it always instantly awake, Render's paid
tier removes the sleep.

**Note on saved data:** on Render's free tier, files written to disk
(like `data/prayers.json`) can be cleared when the service restarts.
For a first website this is fine to get started; if this ministry
grows and you want Prayer Requests permanently saved, tell me and I can
upgrade the backend to a small free database (e.g. Render's free
PostgreSQL, or Google Sheets) so nothing is ever lost.

### Step C — (Optional) Use your own domain name, e.g. www.gracefiredeliverance.org
1. Buy a domain from a registrar (e.g. Namecheap, ~$10–15/year — this
   is the only cost in this whole guide, and it's optional).
2. In Render, open your web service → **Settings** → **Custom Domains**
   → add your domain, then follow Render's instructions to update your
   domain's DNS records at your registrar.

---

## 6. SEO (helping people find you on Google)

Already set up for you:
- Each page has a unique title and description meta tag.
- The homepage includes structured data (`schema.org/Church`) so
  Google understands your church's name, address and phone number.
- Once your site is live, submit it to Google for free at
  https://search.google.com/search-console — add your domain, verify
  ownership (Render/your registrar will show you how), and submit your
  homepage URL. It can take a few days to a few weeks to appear in
  search results.
- Consider also creating a free **Google Business Profile**
  (https://business.google.com) for the church — this helps you show
  up on Google Maps and Google Search for "church in Isheri Osun".

---

## 7. Quick checklist before you go live

- [ ] Update the countdown date if the anniversary date changes
- [ ] Double-check the phone number and WhatsApp links
- [ ] Double-check both bank account numbers on the Partnership page
- [ ] Replace the sermon video links with your real YouTube/Facebook links
- [ ] Add more real photos to the Gallery
- [ ] Test the Prayer Request and Contact forms once the site is live
- [ ] Test on your phone (open the site on your mobile browser)

---

If you get stuck at any step, copy the exact error message you see and
ask — happy to help you through it.
