/**
 * Pokémon Routes
 * API endpoints for fetching Pokémon data
 */

const express = require('express');
const router = express.Router();
const {
  getPokemon,
  getPokemonList,
  getTypes,
  getPokemonByType,
  searchPokemon,
  getSpecies
} = require('../services/pokeapi');

/**
 * GET /api/pokemon/list
 * Fetch paginated list of Pokémon
 */
router.get('/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const data = await getPokemonList(limit, offset);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/:id
 * Fetch single Pokémon details
 */
router.get('/:id', async (req, res) => {
  try {
    const pokemon = await getPokemon(req.params.id);
    const species = await getSpecies(req.params.id);
    
    res.json({
      ...pokemon,
      species: species
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/search/:query
 * Search Pokémon by name or ID
 */
router.get('/search/:query', async (req, res) => {
  try {
    const results = await searchPokemon(req.params.query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/type/:type
 * Fetch Pokémon by type
 */
router.get('/type/:type', async (req, res) => {
  try {
    const pokemon = await getPokemonByType(req.params.type);
    res.json(pokemon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/types/all
 * Fetch all available types
 */
router.get('/types/all', async (req, res) => {
  try {
    const types = await getTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
