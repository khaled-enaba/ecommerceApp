import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { Categories } from '../categories/categories';
import { Product } from '../../shared/model/product.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, switchMap, catchError, of, map, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, Categories],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toastr = inject(ToastrService);
  readonly staticUrl = environment.STATIC_URL;
  private reloadTrigger = new BehaviorSubject<void>(undefined);
  private categoryReloadTrigger = new BehaviorSubject<void>(undefined);
  private _isLoading = signal(true);
  private productsData = toSignal(
    this.reloadTrigger.pipe(
      switchMap(() => {
        this._isLoading.set(true);
        return this.productService.getProducts();
      }),
      map(res => {
        this._isLoading.set(false);
        return res.data || [];
      }),
      catchError(err => {
        console.error('Error loading products:', err);
        this._isLoading.set(false);
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  categories = toSignal(
    this.categoryReloadTrigger.pipe(
      switchMap(() => this.categoryService.getCategories()),
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  products = computed(() => this.productsData() || []);
  isLoading = computed(() => this._isLoading());

  filterQuery = signal('');
  selectedCategory = signal('');

  filteredProducts = computed(() => {
    const query = this.filterQuery().toLowerCase().trim();
    const categoryFilter = this.selectedCategory();
    const allProducts = this.products();

    let filtered = allProducts;

    if (query) {
      filtered = filtered.filter((p: Product) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((p: Product) =>
        p.categoryId?._id === categoryFilter || p.categoryId?.slug === categoryFilter
      );
    }

    return filtered;
  });

  showModal = signal(false);
  isEditing = signal(false);
  currentProduct = signal<Partial<Product> & { imageFiles?: FileList | null }>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: undefined,
    subCategoryId: undefined,
    image: [],
    imageFiles: null
  });

  subCategories = signal<any[]>([]);

  imagePreview = signal<string[]>([]);

  // Modal actions
  openAddModal() {
    this.isEditing.set(false);
    this.currentProduct.set({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: undefined,  
      subCategoryId: undefined,
      image: [],
      imageFiles: null
    });
    this.imagePreview.set([]);
    this.subCategories.set([]);
    this.showModal.set(true);
  }

  openEditModal(product: Product) {
    this.isEditing.set(true);
    this.currentProduct.set({ ...product, imageFiles: null });

    const images = Array.isArray(product.image) ? product.image : [product.image];
    this.imagePreview.set(images.map(img => this.staticUrl + img));

    if (product.categoryId?._id) {
      this.loadSubCategories(product.categoryId._id);
    }

    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.imagePreview.set([]);
  }

  onCategoryChange(categoryId: string) {
    const product = this.currentProduct();
    this.currentProduct.set({ ...product, categoryId: categoryId as any, subCategoryId: undefined });
    this.loadSubCategories(categoryId);
  }

  loadSubCategories(categoryId: string) {
    this.categoryService.getSubCategories(categoryId).subscribe({
      next: (subs) => this.subCategories.set(subs),
      error: () => this.subCategories.set([])
    });
  }

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const product = this.currentProduct();
      this.currentProduct.set({ ...product, imageFiles: input.files });

      // Generate previews
      const previews: string[] = [];
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews.push(e.target?.result as string);
          this.imagePreview.set([...previews]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // CRUD operations
  saveProduct() {
    const product = this.currentProduct();

    if (!product.name || !product.price || product.price <= 0) {
      this.toastr.warning('Please fill in all required fields with valid values');
      return;
    }

    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description || '');
    formData.append('price', product.price.toString());
    formData.append('stock', (product.stock || 0).toString());

    if (product.categoryId) {
      const catId = typeof product.categoryId === 'object' && '_id' in product.categoryId
        ? (product.categoryId as any)._id
        : product.categoryId;
      formData.append('categoryId', catId);
    }

    if (product.subCategoryId) {
      const subCatId = typeof product.subCategoryId === 'object' && '_id' in product.subCategoryId
        ? (product.subCategoryId as any)._id
        : product.subCategoryId;
      formData.append('subCategoryId', subCatId);
    }

    if (product.imageFiles && product.imageFiles.length > 0) {
      Array.from(product.imageFiles).forEach(file => {
        formData.append('image', file);
      });
    }

    if (this.isEditing() && product._id) {
      
      this.productService.updateProduct(product._id, formData).subscribe({
        next: () => {
          this.reloadTrigger.next();
          this.closeModal();
          this.toastr.success('Product updated successfully');
        },
        error: (err: any) => this.toastr.error(err.error?.message || 'Update failed')
      });
    } else {
      // Create new product
      if (!product.imageFiles || product.imageFiles.length === 0) {
        this.toastr.warning('Please select at least one product image');
        return;
      }

      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.reloadTrigger.next();
          this.closeModal();
          this.toastr.success('Product created successfully');
        },
        error: (err: any) => this.toastr.error(err.error?.message || 'Creation failed')
      });
    }
  }

  deleteProduct(id: string, name: string) {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.reloadTrigger.next();
        this.toastr.success('Product deleted successfully');
      },
      error: (err: any) => this.toastr.error(err.error?.message || 'Delete failed')
    });
  }

  // Utility
  getProductImage(image: string | string[]): string {
    if (!image) return 'https://via.placeholder.com/300x300?text=No+Image';
    const imageName = Array.isArray(image) ? image[0] : image;
    return this.staticUrl + imageName;
  }

  getStockStatus(stock: number): 'out' | 'low' | 'in' {
    if (stock === 0) return 'out';
    if (stock < 10) return 'low';
    return 'in';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  // Category Management
  showCategoryModal = signal(false);

  openCategoryModal() {
    this.showCategoryModal.set(true);
  }

  closeCategoryModal() {
    this.showCategoryModal.set(false);
  }

  onCategoryChanged() {
    this.categoryReloadTrigger.next();
  }
}
