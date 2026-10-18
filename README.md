# Baghdad Pothole Map · خريطة حُفَر بغداد

A mobile-first web app for reporting potholes in Baghdad. Anyone can photograph a pothole, pin it on the map, and share it. Every report shows how many days it has gone unfixed and which body is responsible for that road.

## What it does

- **Report:** take or upload a photo and pin the location. The pin comes from the photo's GPS, the phone's location, or a tap on the map. The district and the responsible body (Amanat Baghdad municipality, or the Ministry of Construction & Housing for highways) are filled in automatically.
- **Public map:** every report is a pin with a days-unfixed counter, coloured by age: under 30, 30 to 90, and over 90 days.
- **Worst streets:** districts ranked by unfixed potholes, plus the reports waiting longest.
- **Confirm:** "I've seen it too" (one confirmation per person).
- **Fixed:** mark a pothole fixed with an after photo and a "Fixed by" credit. The page then shows a before/after view.
- **Share:** a 1080×1350 image for Facebook, TikTok and Instagram, using the phone's share sheet where it's available. There are also WhatsApp, Telegram and X links.
- **Arabic and English,** with a full right-to-left layout.

## Run it locally

```bash
npm install
npm run dev
```

Without Supabase keys the app runs in **demo mode**, where reports are saved in your browser only.

## Connect the shared database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Authentication → Sign In / Providers** and turn on **Anonymous sign-ins**. People can then report without creating an account.
3. Open the **SQL editor**, paste in [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the tables, the access rules, the photo bucket, and a limit of 10 reports per person per day.
4. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, found under **Project Settings → API**.
5. Run `npm run dev` again. Reports are now shared and update live.

To remove a spam report, set `hidden = true` on its row in the Supabase table editor.

## Deploy

Run `npm run build` to produce a static site in `dist/`. Host it on Netlify, Vercel or Cloudflare Pages, with the two `VITE_SUPABASE_*` values set as environment variables. People can add the site to their home screen like an app.

## Before a public launch

- **Map tiles:** the map uses [OpenFreeMap](https://openfreemap.org), which is free and needs no API key. For very heavy traffic, consider self-hosting tiles or a paid provider.
- **District boundaries:** districts are matched to the nearest district centre (`src/districts.ts`). Replace this with official boundary polygons and confirm with Amanat Baghdad which municipality covers each area.
- **Moderation:** add a small admin page for hiding reports and reviewing "fixed" claims.
- **App stores:** wrap the same code with Capacitor for Android and iOS builds.
- **Scale:** past a few thousand pins, switch the map to a clustered GeoJSON layer.

## Code map

| Path | What it is |
|---|---|
| `src/App.tsx` | Page layout, stats, tabs |
| `src/components/MapView.tsx` | MapLibre map, report pins, location picker |
| `src/components/ReportSheet.tsx` | New report flow |
| `src/components/DetailSheet.tsx` | Report detail, confirm, share, mark fixed |
| `src/data/` | Storage: Supabase (shared) or localStorage (demo) |
| `src/i18n.ts` | Arabic and English text, responsible-body names |
| `src/districts.ts` | Baghdad districts and municipalities |
| `supabase/schema.sql` | Database, access rules, storage |

Run the tests with `npm test`.
