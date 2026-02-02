import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ProductListService, FiltersState, PaginationState } from '../../core/services/product-list.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { SearchBar } from '../../shared/components/search-bar/search-bar';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { Auth } from '../../core/services/auth';
import { ReviewService } from '../../core/services/review.service';
import { ICategory } from '../../shared/model/product.model';
import { Product } from '../../shared/model/product.model';

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-products-list',
  imports: [CommonModule, FormsModule, ProductCard, SearchBar, RouterLink],
  templateUrl: './products-list.html',
  styleUrl: './products-list.css',
})
export class ProductsList implements OnInit, OnDestroy {
  reviews: any[] = [];
  newReview = { rating: 5, comment: '' };

  // ============================================
  // SERVICES & STATE
  // ============================================
  @ViewChild('productCard') productCard!: ProductCard;
  productListService = inject(ProductListService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);

  categories: ICategory[] = [];

  // Local state
  private destroy$ = new Subject<void>();

  // Loading states
  isLoadingCategories = false;
  categoryError: string | null = null;
  successMessage: string | null = null;

  ngOnInit() {
    // Load products on init
    this.productListService.loadProducts();
    this.cdr.detectChanges();

    // Load categories for filter dropdown
    this.loadCategories();

    // Load reviews
    this.loadReviews();
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  loadReviews() {
    this.reviewService.getRecentReviews().subscribe({
      next: (res: any) => {
        this.reviews = res.data || res;
        console.log("this.reviews", this.reviews);
      },
      error: (err) => console.error('Failed to load reviews', err)
    });
  }

  submitReview() {
    if (!this.isLoggedIn) return;

   
    const user = this.auth.user;
    if (!user) return;

    const reviewData = {
      userId: user.id,
      productId: 'GENERAL_STORE_REVIEW', 
      rating: Number(this.newReview.rating),
      comment: this.newReview.comment
    };

   
    console.log('Submitting review:', reviewData);

    // this.reviewService.addReview(reviewData).subscribe(...);
    this.showSuccessMessage('Review logic implemented but requires product context.');
    this.newReview = { rating: 5, comment: '' };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  
  onSearch(searchTerm: string) {
    this.productListService.setSearchTerm(searchTerm);
  }

 
 
 
  onCategoryChange(categoryId: string) {
    this.productListService.setCategoryFilter(categoryId);
  }

  
  toggleBestSellers() {
    this.productListService.toggleBestSellers()
  }

  
  toggleNewArrivals() {
    this.productListService.toggleNewArrivals();
  }

  
  clearAllFilters() {
    this.productListService.clearFilters();
  }

  
  nextPage() {
    this.productListService.nextPage();
    this.scrollToTop();
  }

  
  previousPage() {
    this.productListService.previousPage();
    this.scrollToTop();
  }

  
  goToPage(pageNumber: number) {
    this.productListService.goToPage(pageNumber);
    this.scrollToTop();
  }

  /**
   * Scroll to top when pagination changes
   */
  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================
  // DATA LOADING
  // ============================================

  /**
   * Load categories for filter dropdown
   */
  private loadCategories() {
    this.isLoadingCategories = true;
    this.categoryError = null;

    this.categoryService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.categories = response.data || response;
          this.isLoadingCategories = false;
        },
        error: (err) => {
          console.error('Failed to load categories:', err);
          this.categoryError = 'Failed to load categories';
          this.isLoadingCategories = false;
        },
      });
  }

  // ============================================
  // CART METHODS
  // ============================================

  /**
   * Handle add to cart from product card
   */
  onAddToCart(item: CartItem) {
    for (let i = 0; i < item.quantity; i++) {
      this.cartService.addToCart(item.product._id, 1);
    }
    this.showSuccessMessage(`${item.quantity} item(s) added to cart!`);
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  // ============================================
  // GETTERS FOR TEMPLATE
  // ============================================

  /**
   * Get current filters
   */
  get filters(): FiltersState {
    return this.productListService.getFilters();
  }

  /**
   * Get current pagination state
   */
  get pagination(): PaginationState {
    return this.productListService.getPagination();
  }

  /**
   * Get array of page numbers for pagination display
   */
  get pageNumbers(): number[] {
    const { currentPage, totalPages } = this.pagination;
    const pages: number[] = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
