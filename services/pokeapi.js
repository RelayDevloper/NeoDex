/**
 * PokeAPI Service
 * Centralized API service for handling PokeAPI calls with caching
 */

const axios = require('axios');

const BASE_URL = 'https://pokeapi.co/api/v2';

// In-memory cache for performance
const cache = {
  pokemon: {},
  types: {},
  species: {}
};

/**
 * Fetch a single Pokémon by name or ID
 */
async function getPokemon(nameOrId) {
  try {
    if (cache.pokemon[nameOrId]) {
      return cache.pokemon[nameOrId];
    }

    const response = await axios.get(`${BASE_URL}/pokemon/${nameOrId}`);
    const data = response.data;
    cache.pokemon[nameOrId] = data;
    cache.pokemon[data.id] = data;
    return data;
  } catch (error) {
    console.error(`Error fetching Pokémon ${nameOrId}:`, error.message);
    throw new Error(`Failed to fetch Pokémon: ${nameOrId}`);
  }
}

/**
 * Fetch list of Pokémon with pagination
 */
async function getPokemonList(limit = 20, offset = 0) {
  try {
    const response = await axios.get(`${BASE_URL}/pokemon`, {
      params: { limit, offset }
    });

    const pokemonList = response.data.results;
    const detailedList = await Promise.all(
      pokemonList.map(p => getPokemon(p.name))
    );

    return {
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: detailedList
    };
  } catch (error) {
    console.error('Error fetching Pokémon list:', error.message);
    throw new Error('Failed to fetch Pokémon list');
  }
}

/**
 * Fetch all types
 */
async function getTypes() {
  try {
    if (Object.keys(cache.types).length > 0) {
      return Object.values(cache.types);
    }

    const response = await axios.get(`${BASE_URL}/type`);
    response.data.results.forEach(type => {
      cache.types[type.name] = type;
    });

    return response.data.results;
  } catch (error) {
    console.error('Error fetching types:', error.message);
    throw new Error('Failed to fetch types');
  }
}

/**
 * Fetch Pokémon by type
 */
async function getPokemonByType(typeName) {
  try {
    const response = await axios.get(`${BASE_URL}/type/${typeName}`);
    const pokemonData = response.data.pokemon.slice(0, 20);
    
    const detailedList = await Promise.all(
      pokemonData.map(p => getPokemon(p.pokemon.name))
    );

    return detailedList;
  } catch (error) {
    console.error(`Error fetching Pokémon of type ${typeName}:`, error.message);
    throw new Error(`Failed to fetch Pokémon of type: ${typeName}`);
  }
}

/**
 * Search Pokémon by name or ID
 */
async function searchPokemon(query) {
  try {
    // Try to fetch as if it's an ID or name
    const pokemon = await getPokemon(query.toLowerCase());
    return [pokemon];
  } catch (error) {
    // If not found, return empty array
    return [];
  }
}

/**
 * Get Pokémon species information (evolution chain, etc.)
 */
async function getSpecies(nameOrId) {
  try {
    if (cache.species[nameOrId]) {
      return cache.species[nameOrId];
    }

    const response = await axios.get(`${BASE_URL}/pokemon-species/${nameOrId}`);
    cache.species[nameOrId] = response.data;
    return response.data;
  } catch (error) {
    console.error(`Error fetching species ${nameOrId}:`, error.message);
    return null;
  }
}

module.exports = {
  getPokemon,
  getPokemonList,
  getTypes,
  getPokemonByType,
  searchPokemon,
  getSpecies
};
