import { CommonModule } from '@angular/common';
import { Component, signal, Input, inject } from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/model/product.model';
import { environment } from '../../../../environments/environment';
import { ProductCard, CartItem } from '../product-card/product-card';
import { CartService } from '../../../core/services/cart.service';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';

@Component({
  selector: 'app-best-seller',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './best-seller.html',
  styleUrl: './best-seller.css',
})
export class BestSeller {
  private _productService = inject(ProductService);
  private cartService = inject(CartService);

  @Input() categoryId: string = '';
  @Input() title: string = 'Best Sellers';

  readonly staticUrl = environment.STATIC_URL;

  // Use toSignal for automatic reactivity
  bestSellers = toSignal(
    this._productService.getBestSellers(this.categoryId ? { category: this.categoryId } : {}),
    { initialValue: [] as Product[] }
  );

  handleAddToCart(item: CartItem) {
    console.log('Adding to cart:', item.product);
    this.cartService.addToCart(item.product._id, item.quantity);
  }
}
