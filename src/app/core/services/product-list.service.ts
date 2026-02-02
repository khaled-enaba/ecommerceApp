import { Injectable, inject, effect } from '@angular/core';
import { signal, computed } from '@angular/core';
import { Product } from '../../shared/model/product.model';
import { ProductService } from '../../core/services/product.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface FiltersState {
  searchTerm: string;
  categoryId: string;
  bestSellersOnly: boolean;
  newArrivalsOnly: boolean;
  sortBy: 'newest' | 'price-asc' | 'price-desc';
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductListService {
  // ============================================
  // STATE SIGNALS
  // ============================================

  /** All products loaded from API */
  products$ = signal<Product[]>([]);

  /** Current filter state */
  filters$ = signal<FiltersState>({
    searchTerm: '',
    categoryId: '',
    bestSellersOnly: false,
    newArrivalsOnly: false,
    sortBy: 'newest',
  });

  /** Current pagination state */
  pagination$ = signal<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  /** Loading state */
  isLoading$ = signal(false);

  /** Error message */
  error$ = signal<string | null>(null);

  /** Subject for cleanup */
  private destroy$ = new Subject<void>();

  private productService = inject(ProductService);

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  /**
   * Filter products based on current filter state
   */
  filteredProducts$ = computed(() => {
    let result = [...this.products$()];
    const filters = this.filters$();

    // Apply search filter
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (filters.categoryId) {
      result = result.filter((p) => p.categoryId._id === filters.categoryId);
    }

    // Apply best sellers filter (and sort)
    if (filters.bestSellersOnly) {
      result = result.filter((p) => (p.soldCount || 0) > 0);
      result.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    }
    // Apply new arrivals filter (and sort)
    else if (filters.newArrivalsOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter((p) => {
        const createdAt = p.createdAt ? new Date(p.createdAt) : new Date(0);
        return createdAt >= thirtyDaysAgo;
      });
      // Sort by newest
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    return result;
  });

  /**
   * Apply pagination to filtered products
   */
  paginatedProducts$ = computed(() => {
    const filtered = this.filteredProducts$();
    const pagination = this.pagination$();

    // Calculate total items and pages
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pagination.pageSize) || 1;

    // Ensure current page is valid
    const currentPage = Math.max(
      1,
      Math.min(pagination.currentPage, totalPages)
    );

    // Get start and end indices
    const startIndex = (currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;

    // Extract paginated products
    const paginatedItems = filtered.slice(startIndex, endIndex);

    return paginatedItems;
  });

  /**
   * Get total number of filtered products (for pagination display)
   */
  totalFilteredProducts$ = computed(
    () => this.filteredProducts$().length
  );

  // Initialize the pagination metadata updater in constructor
  constructor() {
    // Use effect to update pagination metadata when filtered products change
    effect(() => {
      const filtered = this.filteredProducts$();
      const pagination = this.pagination$();

      // Calculate totals
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pagination.pageSize) || 1;

      // Update pagination if totals changed
      if (pagination.totalItems !== totalItems || pagination.totalPages !== totalPages) {
        this.pagination$.update((state) => ({
          ...state,
          totalItems,
          totalPages,
          // Adjust current page if it exceeds new total
          currentPage: Math.min(state.currentPage, totalPages || 1),
        }));
      }
    });
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  /**
   * Update search term
   */
  setSearchTerm(term: string) {
    this.filters$.update((state) => ({
      ...state,
      searchTerm: term,
    }));
    this.resetPagination();
  }

  /**
   * Update category filter
   */
  setCategoryFilter(categoryId: string) {
    this.filters$.update((state) => ({
      ...state,
      categoryId,
    }));
    this.resetPagination();
  }

  /**
   * Toggle best sellers filter (Mutually exclusive with New Arrivals)
   */
  toggleBestSellers() {
    this.filters$.update((state) => ({
      ...state,
      bestSellersOnly: !state.bestSellersOnly,
      newArrivalsOnly: false, // Disable new arrivals
    }));
    this.resetPagination();
  }

  /**
   * Toggle new arrivals filter (Mutually exclusive with Best Sellers)
   */
  toggleNewArrivals() {
    this.filters$.update((state) => ({
      ...state,
      newArrivalsOnly: !state.newArrivalsOnly,
      bestSellersOnly: false, // Disable best sellers
    }));
    this.resetPagination();
  }

  /**
   * Update sort option
   */
  setSortBy(sortBy: 'newest' | 'price-asc' | 'price-desc') {
    this.filters$.update((state) => ({
      ...state,
      sortBy,
      // Optional: Disable special filters if manual sort is selected? 
      // User requested mutual exclusivity between checkboxes, 
      // but didn't specify interaction with manual sort dropdown.
      // For now, checkboxes take precedence in computed logic.
    }));
    this.resetPagination();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters$.set({
      searchTerm: '',
      categoryId: '',
      bestSellersOnly: false,
      newArrivalsOnly: false,
      sortBy: 'newest',
    });
    this.resetPagination();
  }

  // ============================================
  // PAGINATION METHODS
  // ============================================

  /**
   * Go to specific page
   */
  goToPage(pageNumber: number) {
    const totalPages = this.pagination$().totalPages;
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      this.pagination$.update((state) => ({
        ...state,
        currentPage: pageNumber,
      }));
    }
  }

  /**
   * Go to next page
   */
  nextPage() {
    const { currentPage, totalPages } = this.pagination$();
    if (currentPage < totalPages) {
      this.goToPage(currentPage + 1);
    }
  }

  /**
   * Go to previous page
   */
  previousPage() {
    const { currentPage } = this.pagination$();
    if (currentPage > 1) {
      this.goToPage(currentPage - 1);
    }
  }

  /**
   * Reset pagination to first page
   */
  resetPagination() {
    this.pagination$.update((state) => ({
      ...state,
      currentPage: 1,
    }));
  }

  /**
   * Set page size
   */
  setPageSize(size: number) {
    this.pagination$.update((state) => ({
      ...state,
      pageSize: size,
    }));
    this.resetPagination();
  }

  // ============================================
  // DATA LOADING METHODS
  // ============================================

  /**
   * Load all products from API
   */
  loadProducts() {
    this.isLoading$.set(true);
    this.error$.set(null);

    console.log('Loading products from API...');

    this.productService.getProducts({ limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✓ API Response received:', response);
          if (response && response.data && Array.isArray(response.data)) {
            console.log(`✓ Setting ${response.data.length} products`);
            this.products$.set(response.data);
          } else if (Array.isArray(response)) {
            console.log(`✓ Setting ${response.length} products (direct array)`);
            this.products$.set(response);
          } else {
            console.warn('⚠ Unexpected response structure:', response);
            this.error$.set('Invalid response format from API');
            this.products$.set([]);
          }
          this.isLoading$.set(false);
        },
        error: (err) => {
          console.error('✗ API Error:', err);
          console.error('Error message:', err?.message);
          console.error('Error status:', err?.status);
          this.error$.set('Failed to load products. Please check the API connection.');
          this.isLoading$.set(false);
          this.products$.set([]);
        },
        complete: () => {
          console.log('✓ API request completed');
        }
      });
  }

  /**
   * Cleanup
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get the filters state (useful for external components)
   */
  getFilters() {
    return this.filters$();
  }

  /**
   * Get pagination state
   */
  getPagination() {
    return this.pagination$();
  }
}
