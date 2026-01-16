/**
 * NeoDex - Modern Pokédex Website
 * Built with Node.js, Express, and PokeAPI
 */

const express = require('express');
const path = require('path');
const pokemonRoutes = require('./routes/pokemon');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'NeoDex - Pokédex' });
});

app.use('/api/pokemon', pokemonRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✨ NeoDex is running at http://localhost:${PORT}`);
  console.log(`🔥 Node.js version: ${process.version}`);
});
