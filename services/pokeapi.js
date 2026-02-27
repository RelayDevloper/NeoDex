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
  species: {},
  evolutionChains: {}
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

/**
 * Fetch and parse evolution chain data
 */
async function getEvolutionChainByUrl(url) {
  try {
    if (!url) return null;

    const match = url.match(/\/evolution-chain\/(\d+)\//);
    const id = match ? match[1] : null;

    if (!id) return null;

    if (cache.evolutionChains[id]) {
      return cache.evolutionChains[id];
    }

    const response = await axios.get(`${BASE_URL}/evolution-chain/${id}`);
    const chain = response.data.chain;

    const stages = [];
    let currentStage = [chain];

    while (currentStage.length) {
      const detailedStage = await Promise.all(
        currentStage.map(async (node) => {
          const name = node.species.name;
          const pokemon = await getPokemon(name);

          return {
            id: pokemon.id,
            name: pokemon.name,
            sprites: {
              front_default: pokemon.sprites.front_default,
              front_shiny: pokemon.sprites.front_shiny,
              artwork_default: pokemon.sprites.other?.['official-artwork']?.front_default || null,
              artwork_shiny: pokemon.sprites.other?.['official-artwork']?.front_shiny || null
            }
          };
        })
      );

      stages.push(detailedStage);
      currentStage = currentStage.flatMap(node => node.evolves_to);
    }

    const result = {
      id: response.data.id,
      stages
    };

    cache.evolutionChains[id] = result;
    return result;
  } catch (error) {
    console.error('Error fetching evolution chain:', error.message);
    return null;
  }
}

module.exports = {
  getPokemon,
  getPokemonList,
  getTypes,
  getPokemonByType,
  searchPokemon,
  getSpecies,
  getEvolutionChainByUrl
};
