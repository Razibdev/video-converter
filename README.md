# Copyright-Free Video Gallery (Next.js)

A Next.js demo showing **6 ways** to use copyright-free / royalty-free videos in your app.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Import from desktop → YouTube & Facebook

Go to **[http://localhost:3000/upload](http://localhost:3000/upload)**:

1. Drag & drop or browse video files from your PC (MP4, WebM, MOV)
2. Choose license source (your own footage, Pexels, Mixkit, etc.)
3. Complete the copyright-free checklist
4. **Export social media kit** — downloads JSON + YouTube description + Facebook caption + attribution text
5. Upload the same file manually to [YouTube Studio](https://studio.youtube.com) and [Meta Creator Studio](https://business.facebook.com/creatorstudio)

> This app cannot “convert” copyrighted videos to copyright-free. Only use content you own or downloaded from royalty-free sites.

## Video Variant Studio — same video, many versions

**[http://localhost:3000/studio](http://localhost:3000/studio)** — upload one video, pick options, export multiple MP4 files:

| Category | Options |
|----------|---------|
| **Resolution** | 4K, 1080p, 720p, 480p, 360p |
| **Aspect** | 9:16 Reels, 1:1 square, 4:5 Instagram, 16:9 YouTube |
| **Zoom** | In 10% / 25% / 50%, out 10%, Ken Burns slow zoom |
| **Fade** | In 1s/2s, out 1s/2s, in+out, dip to black |
| **Speed** | 0.5×, 0.75×, 1.25×, 1.5×, 2× |
| **Flip** | Mirror horizontal, flip vertical |
| **Color** | Brighter, darker, saturated, B&W, warm |

**Quick packs:** Social (6), Quality (5), Effects (8), Popular (12).

Processing runs in your browser (FFmpeg WASM). First run downloads ~25 MB once.

## Optional: API keys (Pexels & Pixabay)

1. Copy `.env.example` to `.env.local`
2. Add free keys:
   - [Pexels API](https://www.pexels.com/api/)
   - [Pixabay API](https://pixabay.com/api/docs/)
3. Restart `npm run dev`

Keys are only used in server Route Handlers (`src/app/api/`), never exposed to the browser.

## Optional: self-hosted video

Download any free clip (Mixkit, Pexels, Pixabay) and save as:

```
public/videos/sample.mp4
```

## The 6 methods

| # | Method | License | Needs key? |
|---|--------|---------|------------|
| 1 | **Mixkit CDN** — direct MP4 URL | [Mixkit License](https://mixkit.co/license/) | No |
| 2 | **Self-hosted** — `public/videos/` | Your download’s license | No |
| 3 | **Pexels API** — search stock videos | [Pexels License](https://www.pexels.com/license/) | Yes (free) |
| 4 | **Pixabay API** — search stock videos | [Pixabay License](https://pixabay.com/service/license/) | Yes (free) |
| 5 | **Wikimedia Commons** — direct file URLs | Per-file (often CC) | No |
| 6 | **Internet Archive** — public domain streams | Per-item | No |

## Project structure

```
src/
  app/
    upload/page.tsx        # Desktop import + social export
    api/upload/route.ts    # Save video + license JSON to public/uploads/
    api/pexels/route.ts    # Server proxy for Pexels
    api/pixabay/route.ts   # Server proxy for Pixabay
    page.tsx               # Demo UI
  components/
    VideoPlayer.tsx        # HTML5 <video> + attribution
    ApiVideoGallery.tsx    # Search UI for APIs
    SelfHostedVideo.tsx    # Detects public/videos/sample.mp4
    DesktopVideoImport.tsx # Drag-drop import + FB/YT export
  lib/video-sources.ts     # URLs, licenses, metadata
  lib/social-media-licenses.ts  # Checklist + export text
```

## Other free sources (not in demo)

- [Coverr](https://coverr.co/) — free stock video
- [Videvo](https://www.videvo.net/) — free clips (check license per video)
- [NASA Media](https://images.nasa.gov/) — public domain
- [Creative Commons search](https://search.creativecommons.org/)

Always read each platform’s license before commercial use.
