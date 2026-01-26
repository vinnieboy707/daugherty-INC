# Social Media Setup Guide

## Social Preview Image

For optimal social media sharing, add a preview image:

1. Create or obtain a 1200x630px image showcasing your work
2. Save it as `social-preview.jpg` in the `frontend/public/` directory
3. The image will be used when sharing the website on Facebook, Twitter, LinkedIn, etc.

### Image Requirements:
- **Dimensions**: 1200 x 630 pixels (recommended)
- **Format**: JPG or PNG
- **File Size**: Under 5MB
- **Content**: Professional tattoo work or portfolio highlights

### Alternative Names:
If you prefer a different filename, update these files:
- `index.html` (lines 18 and 27 for Open Graph and Twitter meta tags)

## Contact Information

Update contact information in one of two ways:

### Option 1: Environment Variables (Recommended)
Edit `backend/.env`:
```bash
CONTACT_PHONE=+1-555-0123
CONTACT_EMAIL=contact@example.com
CONTACT_INSTAGRAM=@natedaugherty_tattoos
CONTACT_LOCATION=Mendocino, CA
WEBSITE_URL=https://daugherty-inc.com
```

### Option 2: Admin Dashboard
Contact information can also be managed through the Admin Dashboard (feature to be implemented).

## Social Media Integration

### Connected Platforms
The system supports:
- Instagram
- Facebook
- Twitter/X
- TikTok
- Pinterest
- YouTube
- Google Photos

### Admin Promotion Features
From the Admin Dashboard → Social Media & Integrations:
1. **Message Templates** - Pre-written promotional messages
2. **Platform Selection** - Choose which platforms to post to
3. **Scheduling** - Schedule posts for later (UI ready, backend integration pending)
4. **Result Tracking** - See success/failure status for each platform

## Share Buttons

Share buttons are automatically included on:
- Footer (all pages)
- Home page hero section
- Reviews page header

### Customization
To modify the default sharing message, edit:
`frontend/src/components/ShareWebsite.jsx` - line 10
