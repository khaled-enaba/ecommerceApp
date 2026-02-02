import { CommonModule } from '@angular/common';
import { Component, signal, Input, inject } from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/model/product.model';
import { environment } from '../../../../environments/environment';
import { ProductCard, CartItem } from '../product-card/product-card';
import { CartService } from '../../../core/services/cart.service';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-new-arrival',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './new-arrival.html',
  styleUrl: './new-arrival.css',
})
export class NewArrival {
  private _productService = inject(ProductService);
  private cartService = inject(CartService);

  readonly staticUrl = environment.STATIC_URL;
  @Input() categoryId: string = '';
  @Input() title: string = 'New Arrivals';

  // Use toSignal for automatic reactivity
  newArrivals = toSignal(
    this._productService.getNewArrivals(this.categoryId ? { category: this.categoryId } : {}),
    { initialValue: [] as Product[] }
  );

  handleAddToCart(item: CartItem) {
    console.log('Adding to cart:', item.product);
    this.cartService.addToCart(item.product._id, item.quantity);
  }
}
