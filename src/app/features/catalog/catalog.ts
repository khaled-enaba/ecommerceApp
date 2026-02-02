import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductCard, CartItem } from '../../shared/components/product-card/product-card';
import { CartService } from '../../core/services/cart.service';
import { IProductsRes, Product } from '../../shared/model/product.model';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { catchError, of, switchMap, tap } from 'rxjs';

@Component({
    selector: 'app-catalog',
    standalone: true,
    imports: [CommonModule, RouterLink, ProductCard, FormsModule],
    templateUrl: './catalog.html',
    styleUrl: './catalog.css',
})
export class Catalog implements OnInit {
    private route = inject(ActivatedRoute);
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private cartService = inject(CartService);
    private router = inject(Router);
    private toastr = inject(ToastrService);

    products = signal<Product[]>([]);
    categories = signal<any[]>([]);
    isLoading = signal(true);
    currentPage = signal(1);
    totalPages = signal(1);
    totalProducts = signal(0);

    // Filter states
    currentCategory = '';
    searchQuery = '';

    readonly staticUrl = environment.STATIC_URL;

    ngOnInit() {
        this.loadCategories();

        this.route.queryParams.pipe(
            tap(params => {
                this.currentCategory = params['category'] || '';
                this.searchQuery = params['search'] || '';
                this.currentPage.set(Number(params['page']) || 1);
                this.isLoading.set(true);
            }),
            switchMap(params => {
                const fetchParams: any = {
                    page: this.currentPage(),
                    limit: 12
                };
                if (this.currentCategory) fetchParams.category = this.currentCategory;
                if (this.searchQuery) fetchParams.search = this.searchQuery;

                return this.productService.getProducts(fetchParams).pipe(
                    catchError(err => {
                        console.error('Error fetching products:', err);
                        this.isLoading.set(false);
                        return of({ message: 'Error fetching products', data: [], pagination: { total: 0, pages: 1, limit: 12, page: 1 } });
                    })
                );
            })
        ).subscribe((res: IProductsRes) => {
            this.products.set(res.data);
            this.totalProducts.set(res.pagination?.total || 0);
            this.totalPages.set(res.pagination?.pages || 1);
            this.isLoading.set(false);
        });
    }

    loadCategories() {
        this.categoryService.getCategories().subscribe(res => {
            const data = (res as any).data || res;
            this.categories.set(data);
        });
    }

    getCategoryName() {
        const cat = this.categories().find(c => c._id === this.currentCategory);
        return cat ? cat.name : 'Selection';
    }

    onSearch() {
        this.router.navigate(['/products'], {
            queryParams: {
                category: this.currentCategory || null,
                search: this.searchQuery || null,
                page: 1
            }
        });
    }

    handleAddToCart(item: CartItem) {
        this.cartService.addToCart(item.product._id, item.quantity);
        this.toastr.success(`${item.product.name} added to cart!`);
    }

    getPages() {
        return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
    }
}
