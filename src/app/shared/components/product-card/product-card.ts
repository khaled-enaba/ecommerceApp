import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Product } from '../../model/product.model';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard implements OnInit, OnDestroy {
  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<CartItem>();

  readonly staticUrl = environment.STATIC_URL;
  quantity: number = 1;

  ngOnInit() {
    // Initialize quantity to 1
    this.quantity = 1;
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  /**
   * Get safe image URL from product image field
   * Handles both string and string[] formats
   */
  getSafeImage(image: string | string[]): string {
    if (!image) return '';
    const imageName = Array.isArray(image) ? image[0] : image;
    return this.staticUrl + imageName;
  }

  /**
   * Get stock warning class based on remaining stock
   * Red: 1 item | Orange: 2-3 items
   */
  getStockWarningClass(): string {
    if (this.product.stock === 1) {
      return 'red';
    } else if (this.product.stock >= 2 && this.product.stock <= 3) {
      return 'orange';
    }
    return '';
  }

  /**
   * Increment quantity spinner
   */
  incrementQuantity() {
    if (this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  /**
   * Decrement quantity spinner
   */
  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /**
   * Emit add to cart event with selected quantity
   */
  onAddToCart() {
    if (this.product.stock > 0) {
      this.addToCart.emit({
        product: this.product,
        quantity: this.quantity,
      });
      // Reset quantity after adding to cart
      this.quantity = 1;
    }
  }
  /**
   * Check if product is a best seller
   */
  get isBestSeller(): boolean {
    return (this.product.soldCount || 0) > 0;
  }

  /**
   * Check if product is a new arrival
   */
  get isNewArrival(): boolean {
    if (!this.product.createdAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(this.product.createdAt) >= thirtyDaysAgo;
  }
}
