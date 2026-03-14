# Deity image on the pass

The pass shows an image of **Sri Sri Radha Veni Madhav** (or your chosen deity) on the left panel.

## Option 1: Add your image via the images folder (recommended)

1. Put your deity image in the **`public/images/`** folder.
2. Name it **`deity-veni-madhav.jpg`** (or `deity-veni-madhav.png`).
3. The pass will use it automatically. Use a landscape or square image for best fit.

## Option 2: Use a URL via environment variable

In your `.env` file add:

```env
VITE_DEITY_IMAGE_URL=https://example.com/path-to-your-deity-image.jpg
```

The app will use this URL instead of `/deity-veni-madhav.jpg`.

## Fallback

If no image is found, the pass shows a styled text: **Sri Sri Radha Veni Madhav – ISKCON Prayagraj**.
