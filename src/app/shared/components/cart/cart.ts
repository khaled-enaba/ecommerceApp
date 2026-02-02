import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cart.html',
    styleUrl: './cart.css',
})
export class Cart {
    cartService = inject(CartService);
    readonly staticUrl = environment.STATIC_URL;

    items = this.cartService.items;

    get total() {
        return this.items().reduce((acc, item) => {
            const price = item.product?.price || 0;
            return acc + price * item.quantity;
        }, 0);
    }

    updateQuantity(itemId: string, quantity: number) {
        if (quantity < 1) return;
        this.cartService.updateCartItemQuantity(itemId, quantity).subscribe({});
    }

    removeItem(itemId: string) {
        this.cartService.removeFromCart(itemId).subscribe({});
    }
}
