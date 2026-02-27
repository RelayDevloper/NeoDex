/**
 * NeoDex - Main Application JavaScript
 * Handles UI interactions, API calls, and data management
 */

class NeoDex {
  constructor() {
    this.currentPage = 0;
    this.itemsPerPage = 20;
    this.allPokemon = [];
    this.filteredPokemon = [];
    this.favorites = this.loadFavorites();
    this.types = [];
    this.currentType = '';
    this.currentSort = 'id';
    this.currentSearch = '';
    this.isShinyMode = false;
    this.isLoadingMore = false;

    this.initializeElements();
    this.setupEventListeners();
    this.loadInitialData();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.searchInput = document.getElementById('searchInput');
    this.typeFilter = document.getElementById('typeFilter');
    this.sortSelect = document.getElementById('sortSelect');
    this.pokemonGrid = document.getElementById('pokemonGrid');
    this.modal = document.getElementById('pokemonModal');
    this.modalClose = document.querySelector('.modal-close');
    this.modalBody = document.getElementById('modalBody');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.pageInfo = document.getElementById('pageInfo');
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.favoritesBtn = document.getElementById('favoritesBtn');
    this.favoriteCount = document.getElementById('favoriteCount');
    this.shinyToggle = document.getElementById('shinyToggle');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.typeFilter.addEventListener('change', () => this.handleTypeFilter());
    this.sortSelect.addEventListener('change', () => this.handleSort());
    this.modalClose.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
    this.prevBtn.addEventListener('click', () => this.previousPage());
    this.nextBtn.addEventListener('click', () => this.nextPage());
    this.favoritesBtn.addEventListener('click', () => this.showFavorites());

    if (this.shinyToggle) {
      this.shinyToggle.addEventListener('click', () => this.toggleShinyMode());
    }

    window.addEventListener('scroll', () => this.handleScroll());

    this.pokemonGrid.addEventListener('click', (e) => {
      const favoriteBtn = e.target.closest('.favorite-btn');
      const card = e.target.closest('.pokemon-card');

      if (favoriteBtn) {
        e.stopPropagation();
        const index = parseInt(favoriteBtn.dataset.index, 10);
        const pokemon = this.filteredPokemon[index];
        if (pokemon) {
          this.toggleFavorite(pokemon.id, favoriteBtn);
        }
        return;
      }

      if (card) {
        const index = parseInt(card.dataset.index, 10);
        const pokemon = this.filteredPokemon[index];
        if (pokemon) {
          this.showPokemonDetail(pokemon);
        }
      }
    });
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    this.showLoading(true);
    try {
      await Promise.all([this.loadPokemonList(), this.loadTypes()]);
      this.applyFiltersAndSort();
      this.displayPage();
      this.updateFavoriteCount();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to load Pokédex data');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Load Pokémon list
   */
  async loadPokemonList() {
    try {
      let allPokemon = [];
      let offset = 0;
      const limit = 20;

      // Fetch all Pokémon (up to 500 for reasonable loading)
      while (offset < 500) {
        const response = await fetch(`/api/pokemon/list?limit=${limit}&offset=${offset}`);
        const data = await response.json();

        if (data.results) {
          allPokemon = [...allPokemon, ...data.results];
        }

        if (!data.next) break;
        offset += limit;
      }

      this.allPokemon = allPokemon;
      this.filteredPokemon = [...this.allPokemon];
    } catch (error) {
      console.error('Error loading Pokémon list:', error);
      throw error;
    }
  }

  /**
   * Load types
   */
  async loadTypes() {
    try {
      const response = await fetch('/api/pokemon/types/all');
      const types = await response.json();

      this.types = types.map(t => t.name).sort();

      // Populate type filter
      this.typeFilter.innerHTML = '<option value="">All Types</option>';
      this.types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        this.typeFilter.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading types:', error);
    }
  }

  /**
   * Handle search
   */
  handleSearch() {
    this.currentSearch = this.searchInput.value.toLowerCase();
    this.currentPage = 0;
    this.applyFiltersAndSort();
    this.displayPage({ reset: true });
  }

  /**
   * Handle type filter
   */
  handleTypeFilter() {
    this.currentType = this.typeFilter.value;
    this.currentPage = 0;
    this.applyFiltersAndSort();
    this.displayPage({ reset: true });
  }

  /**
   * Handle sort
   */
  handleSort() {
    this.currentSort = this.sortSelect.value;
    this.applyFiltersAndSort();
    this.displayPage({ reset: true });
  }

  /**
   * Apply filters and sorting
   */
  applyFiltersAndSort() {
    let filtered = [...this.allPokemon];

    // Apply search filter
    if (this.currentSearch) {
      filtered = filtered.filter(pokemon => {
        const name = pokemon.name.toLowerCase();
        const id = pokemon.id.toString();
        return name.includes(this.currentSearch) || id.includes(this.currentSearch);
      });
    }

    // Apply type filter
    if (this.currentType) {
      filtered = filtered.filter(pokemon => {
        return pokemon.types.some(t => t.type.name === this.currentType);
      });
    }

    // Apply sorting
    switch (this.currentSort) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'stats':
        filtered.sort((a, b) => {
          const aStats = a.stats.reduce((sum, s) => sum + s.base_stat, 0);
          const bStats = b.stats.reduce((sum, s) => sum + s.base_stat, 0);
          return bStats - aStats;
        });
        break;
      case 'id':
      default:
        filtered.sort((a, b) => a.id - b.id);
        break;
    }

    this.filteredPokemon = filtered;
    this.updatePaginationButtons();
  }

  /**
   * Display current page (supports infinite scroll)
   */
  displayPage({ reset = false } = {}) {
    if (reset) {
      this.pokemonGrid.innerHTML = '';
      this.currentPage = 0;
    }

    if (this.filteredPokemon.length === 0) {
      this.pokemonGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No Pokémon Found</div>
          <p>Try adjusting your search or filters</p>
        </div>
      `;
      this.updatePaginationButtons();
      return;
    }

    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageItems = this.filteredPokemon.slice(startIndex, endIndex);

    if (pageItems.length === 0) {
      this.updatePaginationButtons();
      return;
    }

    const cardsHtml = pageItems
      .map((pokemon, index) => this.createPokemonCard(pokemon, startIndex + index))
      .join('');

    this.pokemonGrid.insertAdjacentHTML('beforeend', cardsHtml);

    this.updatePageInfo();
  }

  /**
   * Create Pokémon card HTML
   */
  createPokemonCard(pokemon, index) {
    const isFavorited = this.favorites.includes(pokemon.id);
    const baseStats = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
    const imageUrl = this.getPokemonImage(pokemon);

    return `
      <div class="pokemon-card" data-index="${index}">
        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-index="${index}" title="Add to favorites">
          ${isFavorited ? '⭐' : '☆'}
        </button>
        <div class="pokemon-id">#${String(pokemon.id).padStart(4, '0')}</div>
        <img src="${imageUrl}" 
             alt="${pokemon.name}" class="pokemon-image">
        <h3 class="pokemon-name">${pokemon.name}</h3>
        <div class="pokemon-types">
          ${pokemon.types
            .map(t => `<span class="type-badge ${t.type.name}">${t.type.name}</span>`)
            .join('')}
        </div>
        <div class="pokemon-stats">
          <strong>Total Stats:</strong> ${baseStats}
        </div>
      </div>
    `;
  }

  /**
   * Get appropriate Pokémon image based on shiny mode
   */
  getPokemonImage(pokemon) {
    const sprites = pokemon.sprites || {};
    const artwork = sprites.other && sprites.other['official-artwork'];

    if (this.isShinyMode) {
      return (
        (artwork && (artwork.front_shiny || artwork.front_default)) ||
        sprites.front_shiny ||
        sprites.front_default
      );
    }

    return (
      (artwork && artwork.front_default) ||
      sprites.front_default ||
      sprites.front_shiny
    );
  }

  /**
   * Show Pokémon detail modal
   */
  async showPokemonDetail(pokemon) {
    try {
      const response = await fetch(`/api/pokemon/${pokemon.id}`);
      const fullData = await response.json();

      const baseStats = fullData.stats.reduce((sum, s) => sum + s.base_stat, 0);
      const mainAbility = fullData.abilities.find(a => !a.is_hidden);
      const hiddenAbility = fullData.abilities.find(a => a.is_hidden);

      const height = (fullData.height / 10).toFixed(1);
      const weight = (fullData.weight / 10).toFixed(1);

      const mainImage = this.getPokemonImage(fullData);

      const evolutionHtml = fullData.evolutionChain
        ? this.createEvolutionChain(fullData.evolutionChain)
        : '';

      this.modalBody.innerHTML = `
        <div class="modal-header">
          <img src="${mainImage}" 
               alt="${fullData.name}" class="modal-image">
          <div class="modal-info">
            <h2>${fullData.name}</h2>
            <div class="pokemon-id">#${String(fullData.id).padStart(4, '0')}</div>
            <div class="modal-types">
              ${fullData.types
                .map(t => `<span class="type-badge ${t.type.name}">${t.type.name}</span>`)
                .join('')}
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-item">
            <span class="info-label">Height</span>
            <span class="info-value">${height} m</span>
          </div>
          <div class="info-item">
            <span class="info-label">Weight</span>
            <span class="info-value">${weight} kg</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Stats</span>
            <span class="info-value">${baseStats}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Gen</span>
            <span class="info-value">-</span>
          </div>
        </div>

        <div class="stats-section">
          <h3>Base Stats</h3>
          ${this.createStatBars(fullData.stats)}
        </div>

        <div class="abilities-section">
          <h3>Abilities</h3>
          ${mainAbility ? `<div class="ability-item">${mainAbility.ability.name}</div>` : ''}
          ${hiddenAbility ? `<div class="ability-item hidden">${hiddenAbility.ability.name} <span class="hidden-label">(Hidden)</span></div>` : ''}
        </div>

        ${evolutionHtml}
      `;

      this.modal.classList.add('active');
    } catch (error) {
      console.error('Error loading Pokémon detail:', error);
      this.showError('Failed to load Pokémon details');
    }
  }

  /**
   * Create evolution chain HTML
   */
  createEvolutionChain(evolutionChain) {
    if (!evolutionChain || !Array.isArray(evolutionChain.stages) || evolutionChain.stages.length === 0) {
      return '';
    }

    const stagesHtml = evolutionChain.stages
      .map((stage, stageIndex) => {
        const pokemonHtml = stage
          .map((p) => {
            const img =
              (p.sprites && (p.sprites.artwork_default || p.sprites.front_default)) ||
              '';
            return `
              <div class="evolution-pokemon">
                ${img ? `<img src="${img}" alt="${p.name}" />` : ''}
                <span class="evolution-name">${p.name}</span>
              </div>
            `;
          })
          .join('');

        const arrow = stageIndex < evolutionChain.stages.length - 1
          ? '<div class="evolution-arrow">➜</div>'
          : '';

        return `
          <div class="evolution-stage-wrapper">
            <div class="evolution-stage">
              ${pokemonHtml}
            </div>
            ${arrow}
          </div>
        `;
      })
      .join('');

    return `
      <div class="evolution-section">
        <h3>Evolution Chain</h3>
        <div class="evolution-chain">
          ${stagesHtml}
        </div>
      </div>
    `;
  }

  /**
   * Create stat bars HTML
   */
  createStatBars(stats) {
    return stats
      .map(stat => {
        const maxStat = 255;
        const percentage = (stat.base_stat / maxStat) * 100;
        const statName = stat.stat.name.replace('-', ' ').toUpperCase();

        return `
          <div class="stat-bar">
            <span class="stat-label">${statName}</span>
            <span class="stat-value">${stat.base_stat}</span>
            <div class="stat-fill">
              <div class="stat-progress" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Close modal
   */
  closeModal() {
    this.modal.classList.remove('active');
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(pokemonId, button) {
    const index = this.favorites.indexOf(pokemonId);

    if (index > -1) {
      this.favorites.splice(index, 1);
      button.classList.remove('favorited');
      button.textContent = '☆';
    } else {
      this.favorites.push(pokemonId);
      button.classList.add('favorited');
      button.textContent = '⭐';
    }

    this.saveFavorites();
    this.updateFavoriteCount();
  }

  /**
   * Show favorites
   */
  showFavorites() {
    if (this.favorites.length === 0) {
      alert('No favorites yet! Click the ☆ icon on a Pokémon to add it.');
      return;
    }

    this.filteredPokemon = this.allPokemon.filter(p => this.favorites.includes(p.id));
    this.currentPage = 0;
    this.displayPage({ reset: true });
    this.favoritesBtn.textContent = `✓ Favorites (${this.favorites.length})`;
  }

  /**
   * Update favorite count
   */
  updateFavoriteCount() {
    this.favoriteCount.textContent = this.favorites.length;
  }

  /**
   * Save favorites to local storage
   */
  saveFavorites() {
    localStorage.setItem('neodex-favorites', JSON.stringify(this.favorites));
  }

  /**
   * Load favorites from local storage
   */
  loadFavorites() {
    const saved = localStorage.getItem('neodex-favorites');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Update pagination buttons
   */
  updatePaginationButtons() {
    const maxPages = Math.ceil(this.filteredPokemon.length / this.itemsPerPage);
    this.prevBtn.disabled = this.currentPage === 0;
    this.nextBtn.disabled = this.currentPage >= maxPages - 1;
  }

  /**
   * Update page info
   */
  updatePageInfo() {
    const maxPages = Math.ceil(this.filteredPokemon.length / this.itemsPerPage) || 1;
    const shown = Math.min((this.currentPage + 1) * this.itemsPerPage, this.filteredPokemon.length);
    this.pageInfo.textContent = `Showing ${shown} of ${this.filteredPokemon.length}`;
  }

  /**
   * Next page
   */
  nextPage() {
    const maxPages = Math.ceil(this.filteredPokemon.length / this.itemsPerPage);
    if (this.currentPage < maxPages - 1) {
      this.currentPage++;
      this.displayPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Previous page
   */
  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.displayPage({ reset: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Handle infinite scroll
   */
  handleScroll() {
    if (this.isLoadingMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 300;

    if (scrollPosition >= threshold) {
      const maxPages = Math.ceil(this.filteredPokemon.length / this.itemsPerPage);
      if (this.currentPage < maxPages - 1) {
        this.isLoadingMore = true;
        this.currentPage++;
        this.displayPage();
        this.isLoadingMore = false;
      }
    }
  }

  /**
   * Toggle shiny mode
   */
  toggleShinyMode() {
    this.isShinyMode = !this.isShinyMode;

    if (this.shinyToggle) {
      this.shinyToggle.classList.toggle('active', this.isShinyMode);
      this.shinyToggle.textContent = this.isShinyMode ? '✨ Shiny: On' : '✨ Shiny: Off';
    }

    this.displayPage({ reset: true });
  }

  /**
   * Show loading indicator
   */
  showLoading(show) {
    if (show) {
      this.loadingIndicator.classList.add('active');
    } else {
      this.loadingIndicator.classList.remove('active');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    this.pokemonGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Error</div>
        <p>${message}</p>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.neoDex = new NeoDex();
});
