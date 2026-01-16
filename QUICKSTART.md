# 🎮 NeoDex - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### 3. Open in Browser
```
http://localhost:3000
```

---

## 📋 Features at a Glance

✅ **Browse 500+ Pokémon** with beautiful cards  
✅ **Search** by name or Pokédex ID  
✅ **Filter** by Pokémon type  
✅ **Sort** by ID, name, or base stats  
✅ **Save favorites** to local storage  
✅ **View detailed stats** in interactive modals  
✅ **Responsive design** for all devices  
✅ **Dark mode** with glassmorphism UI  

---

## 📁 Project Structure

```
NeoDex/
├── app.js              # Express server
├── package.json        # Dependencies
├── public/
│   ├── css/styles.css  # Main stylesheet
│   └── js/app.js       # Client-side logic
├── views/
│   └── index.ejs       # Main template
├── routes/
│   └── pokemon.js      # API routes
├── services/
│   └── pokeapi.js      # PokeAPI integration
└── README.md           # Full documentation
```

---

## 🔌 API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/pokemon/list` | Get paginated Pokémon list |
| `GET /api/pokemon/:id` | Get Pokémon details |
| `GET /api/pokemon/search/:query` | Search Pokémon |
| `GET /api/pokemon/type/:type` | Filter by type |
| `GET /api/pokemon/types/all` | Get all types |

---

## 🎨 Design Highlights

- **Dark Mode**: Professional navy background
- **Glassmorphism**: Frosted glass effect on cards
- **Type Colors**: Each Pokémon type has unique color
- **Smooth Animations**: Hover effects and transitions
- **Type Badges**: Color-coded elemental types
- **Stat Bars**: Animated progress indicators

---

## 🌟 Key Technologies

- **Backend**: Node.js + Express.js
- **Frontend**: HTML5 + CSS3 + Vanilla JS
- **API**: PokeAPI (https://pokeapi.co)
- **Template**: EJS
- **Caching**: In-memory for performance

---

## ⚖️ Legal Notice

This is a fan-made, non-commercial educational project.  
Pokémon is a trademark of Nintendo/Game Freak/The Pokémon Company.

---

**Enjoy exploring the Pokédex! 🎮✨**
