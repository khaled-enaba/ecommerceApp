import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/model/product.model';
import { environment } from '../../../../environments/environment';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBar implements OnInit, OnDestroy {

  @Input() autoFocus = false;
  @Input() placeholder = 'Search for products, brands, or styles...';
  @Output() close = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();

  searchQuery = '';
  searchResults: Product[] = [];
  isSearching = false;
  readonly staticUrl = environment.STATIC_URL;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private productService = inject(ProductService);
  private router = inject(Router);

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.performSearch(query);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
    // Emit search change event
    this.searchChange.emit(query);
  }

  onFocus() {
    // Handle focus event
  }

  performSearch(query: string) {
    if (!query.trim()) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;

    this.productService.getProducts({ search: query, limit: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.searchResults = res.data;
          this.isSearching = false;
        },
        error: (err) => {
          console.error('Search error:', err);
          this.isSearching = false;
        }
      });
  }

  selectTag(tag: any) {
    this.searchQuery = tag.label;
    this.onSearchChange(tag.label);
  }

  getSafeImage(image: string | string[]): string {
    if (!image) return '';
    const name = Array.isArray(image) ? image[0] : image;
    return this.staticUrl + name;
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchChange.emit('');
  }
}

