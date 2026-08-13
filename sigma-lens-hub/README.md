# 🌌 SIGMA LENS HUB & CONTROL PANEL

**Cyberpunk Full-Stack Dashboard & Link Hub** - A high-tech, visually stunning link aggregator with real-time metrics, live terminal effects, and comprehensive admin control panel.

## ✨ Features

- **Cyberpunk UI Design** - Neon cyan, purple, and deep dark aesthetic with glassmorphism effects
- **Live Terminal HUD** - Real-time system status and data stream display
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Full-Stack Architecture** - Express.js backend with SQLite database
- **JWT Authentication** - Secure admin access with token-based auth
- **Link Management** - Create, read, update, delete links with categories
- **Profile Customization** - Avatar and banner upload with theme selection
- **Analytics Dashboard** - Real-time metrics and click tracking
- **Admin Panel** - Comprehensive control panel for managing all aspects
- **System Logs** - Track all system actions

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Extract the `sigma-lens-hub.zip` file
2. Navigate to the project directory:
```bash
cd sigma-lens-hub
```

3. Install dependencies:
```bash
npm install
```

4. Start the server:
```bash
npm start
```

5. Open your browser and visit:
   - **Hub**: http://localhost:3000
   - **Admin Panel**: http://localhost:3000/admin

### Default Credentials
```
Username: admin
Password: admin123
```

## 📁 Project Structure

```
sigma-lens-hub/
├── server.js                 # Express backend with SQLite
├── package.json             # Dependencies configuration
├── data/                    # SQLite database files
├── public/
│   ├── index.html          # Main hub page
│   ├── admin.html          # Admin dashboard
│   ├── uploads/            # Uploaded images
│   ├── css/
│   │   ├── style.css       # Hub page styling
│   │   └── admin.css       # Admin panel styling
│   └── js/
│       ├── main.js         # Hub page functionality
│       └── admin.js        # Admin panel functionality
└── README.md               # This file
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/verify` - Verify JWT token

### Links
- `GET /api/links` - Get all links
- `GET /api/links/:id` - Get specific link
- `POST /api/links` - Create new link (requires auth)
- `PUT /api/links/:id` - Update link (requires auth)
- `DELETE /api/links/:id` - Delete link (requires auth)
- `POST /api/links/:id/click` - Record link click

### Profile
- `GET /api/profile` - Get profile info
- `PUT /api/profile` - Update profile with image upload (requires auth)

### Stats
- `GET /api/stats` - Get system statistics

### Logs
- `GET /api/logs` - Get system logs (requires auth)
- `POST /api/logs` - Add log entry

## 🎨 Customization

### Color Scheme
Edit CSS variables in `public/css/style.css` and `public/css/admin.css`:
```css
--cyan: #00d9ff;
--purple: #d946ef;
--primary-dark: #0a0e27;
```

### Theme Selector
The hub page includes a theme selector for quick color switching:
- **Cyberpunk** - Default cyan/purple theme
- **Neon** - Bright lime green theme
- **Matrix** - Green monochrome theme

## 🔐 Security Notes

⚠️ **Important**: This is a demo application. For production use:
1. Change default admin password immediately
2. Generate a new JWT secret in `server.js`
3. Enable HTTPS/SSL
4. Use environment variables for sensitive data
5. Implement proper password hashing
6. Add rate limiting
7. Validate all user inputs

## 📱 Browser Support

- Chrome/Chromium (v90+)
- Firefox (v88+)
- Safari (v14+)
- Edge (v90+)

## 🎯 Usage Guide

### For Users
1. Visit http://localhost:3000 to access the hub
2. View all available links organized by category
3. Click links to visit destinations (clicks are tracked)
4. See real-time metrics and system status

### For Admins
1. Visit http://localhost:3000/admin
2. Log in with admin credentials
3. Manage links (Create, Read, Update, Delete)
4. Configure hub profile and avatar
5. Monitor analytics and system logs
6. Change themes and settings

## 🛠️ Development

To modify the code:

1. Edit HTML files in `public/` directory
2. Modify CSS in `public/css/` for styling
3. Update JavaScript in `public/js/` for functionality
4. Modify `server.js` for backend changes
5. Restart the server after changes

## 📦 Dependencies

- **express** - Web framework
- **sqlite3** - Database
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **cors** - Cross-Origin Resource Sharing

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in server.js or use:
PORT=3001 npm start
```

### Database Issues
Delete the `data/sigma-lens.db` file and restart to reinitialize.

### Dependencies Not Installing
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

MIT License - Feel free to use and modify

## 🤝 Support

For issues or questions, check the code comments or modify as needed.

---

**Created with ❤️ for Cyberpunk Enthusiasts** 🌌⚡
