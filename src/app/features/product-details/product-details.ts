import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../shared/model/product.model';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-product-details',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-details.html',
    styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
    private route = inject(ActivatedRoute);
    private productService = inject(ProductService);
    private cartService = inject(CartService);
    private toastr = inject(ToastrService);
    constructor(private cdr: ChangeDetectorRef) { }


    product: Product | null = null;
    isLoading = true;
    quantity = 1;
    readonly staticUrl = environment.STATIC_URL;

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.loadProduct(params['id']);
            }
        });
    }

    loadProduct(id: string) {
        this.isLoading = true;
        this.productService.getProductById(id).subscribe({
            next: (res) => {
                this.product = res;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading product:', err);
                this.isLoading = false;
            }
        });
    }

    increaseQuantity() {
        if (this.product && this.quantity < this.product.stock) {
            this.quantity++;
        }
    }

    decreaseQuantity() {
        if (this.quantity > 1) {
            this.quantity--;
        }
    }

    addToCart() {
        if (!this.product) return;

        this.cartService.addToCart(this.product._id, this.quantity);
        this.toastr.success(`${this.quantity} x ${this.product.name} added to cart!`);
    }

    getSafeImage(image: string | string[]): string {
        if (!image) return '';
        const name = Array.isArray(image) ? image[0] : image;
        return this.staticUrl + name;
    }
}
