# NotFollow

A modern web application built with Astro to help you identify people who don't follow you back on social media platforms.

## 🚀 Features

- **Multi-Platform Support**: Instagram, TikTok, GitHub, and X (Twitter)
- **Modern UI**: Beautiful dark mode with glassmorphism effects and smooth animations
- **Fast Performance**: Built with Astro for optimal loading speeds
- **Privacy First**: All processing happens client-side - your data never leaves your browser
- **Pagination**: Efficiently browse through large follower lists
- **Bulk Actions**: Open multiple profiles at once with confirmation
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🎯 Supported Platforms

### ✅ Instagram
- Upload `followers_*.json` and `following.json` files
- Robust parsing with fallback mechanisms
- Normalized profile URLs

### ✅ TikTok
- Upload single `user_data_tiktok.json` file
- Shows username and follow date
- Direct links to TikTok profiles

### ✅ GitHub
- No file upload required - just enter username
- Fetches data directly from GitHub API
- Two modes: Check who doesn't follow you back & Check who you don't follow back
- Shows avatar and profile information

### ✅ X (Twitter)
- Upload `follower.js` and `following.js` files from Twitter data export
- Parses JavaScript files automatically
- Links to Twitter profiles

## 🛠️ Tech Stack

- [Astro](https://astro.build) - Web framework with zero JS by default
- [Tailwind CSS v4](https://tailwindcss.com) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org) - Type-safe JavaScript
- Vanilla JavaScript for client-side processing

## 📂 Project Structure

```
/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Navbar.astro
│   │   └── Footer.astro
│   ├── layouts/        # Page layouts
│   │   └── Layout.astro
│   ├── pages/          # Routes (file-based routing)
│   │   ├── index.astro      # Homepage
│   │   ├── instagram.astro  # Instagram checker
│   │   ├── tiktok.astro     # TikTok checker
│   │   ├── github.astro     # GitHub checker
│   │   └── x.astro          # X/Twitter checker
│   └── styles/         # Global styles
│       └── global.css
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🚦 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:4321`

## 📱 How to Use

### Instagram

1. Go to Instagram and download your data:
   - Profile → Menu (☰) → **Accounts Center**
   - **Your information and permissions** → **Download your information**
   - **Download or transfer information** → Select profiles
   - **Next** → **Some of your information**
   - Choose **Followers and Following** → **Next**
   - **Download to device**
   - Date range: **All time**, Format: **JSON**, Media quality: **Low**
   - **Create files**

2. Wait for email notification (can take a few hours)

3. Upload the files:
   - Upload `followers_*.json` files (can be multiple)
   - Upload `following.json` file

4. Click "Check Non-Followers"

### TikTok

1. Download your TikTok data:
   - Profile → Menu (☰) → **Settings and privacy**
   - **Account** → **Download your data**
   - Select **JSON** format
   - Request and download the file

2. Upload `user_data_tiktok.json` or `user_data.json`

3. Click "Check Non-Followers"

### GitHub

1. Simply enter any GitHub username (including your own)

2. Choose your check mode:
   - **Check who doesn't follow you back**
   - **Check who you don't follow back**

3. Results are fetched directly from GitHub API

### X (Twitter)

1. Download your X data:
   - Settings → **Your account** → **Download an archive of your data**
   - Wait for email with download link
   - Extract the ZIP file

2. Upload both files:
   - `follower.js` from the archive
   - `following.js` from the archive

3. Click "Check Non-Followers"

## 🎨 Features

### Pagination
- Default: 10 items per page
- Options: 10, 25, 50, 100 items per page
- Page numbers with ellipsis for large datasets
- Previous/Next navigation

### Bulk Actions
- **Open All**: Opens all profiles in separate tabs (with confirmation)
- Sequential opening with delay to avoid browser popup blocking

### Mark as Unfollowed
- Checkbox to track who you've unfollowed
- Visual strikethrough effect
- Auto-check when clicking profile links

### Dark Mode
- Default: Dark mode enabled
- Toggle between light and dark themes
- Preference saved in localStorage
- Smooth transitions

## 🔧 Development

### Adding a New Platform

1. Create a new page in `src/pages/[platform].astro`
2. Copy the structure from an existing platform page
3. Customize the parsing logic for the platform's JSON format
4. Update navigation in `src/components/Navbar.astro`
5. Add platform card in `src/pages/index.astro`

### Customizing the Theme

Edit `src/styles/global.css` for global styles. The project uses Tailwind v4 with custom dark mode variant:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

This enables class-based dark mode instead of media query based.

### Theme Toggle Implementation

Theme is managed in `src/layouts/Layout.astro`:
- Initial theme set in `<head>` to prevent FOUC
- Toggle button in `src/components/Navbar.astro`
- Stored as `color-theme` in localStorage

## 🏗️ Building for Production

```bash
npm run build
```

The build output will be in `./dist/` directory, ready to deploy to:
- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- Any static hosting service

### Deployment Tips

1. All platforms work with static site generation
2. No server-side processing required
3. No environment variables needed
4. Works with any CDN

## 🔒 Privacy & Security

- **No data storage**: All processing happens in your browser
- **No external API calls** (except GitHub which uses public API)
- **No analytics or tracking**: Your activity is completely private
- **Open source**: Code is transparent and auditable
- **No authentication required**: No login, no account creation

## 📊 Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## 🐛 Known Limitations

- **Browser popup blockers**: "Open All" feature may be limited by browser security
- **API rate limits**: GitHub API has rate limits (60 requests/hour for unauthenticated)
- **Large datasets**: Very large follower lists (10,000+) may slow down processing

## 📝 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💬 Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Check existing issues for solutions

## 🙏 Acknowledgments

- Thanks to all contributors
- Built with [Astro](https://astro.build)
- Styled with [Tailwind CSS](https://tailwindcss.com)

---

**Made with ❤️ for privacy-conscious social media users**