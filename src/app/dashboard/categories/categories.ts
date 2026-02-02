import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CategoryService } from '../../core/services/category.service';

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './categories.html',
    styleUrl: './categories.css',
})
export class Categories implements OnInit {
    @Input() isModal = false;
    @Output() close = new EventEmitter<void>();
    @Output() categoryChanged = new EventEmitter<void>();

    private categoryService = inject(CategoryService);
    private toastr = inject(ToastrService);

    categories: any[] = [];
    isLoading = false;

    // Form states
    isEditing = false;
    currentCategory = { _id: '', name: '' };

    // Subcategory form
    newSubCategoryName = '';
    selectedParentCategory = '';

    ngOnInit() {
        this.loadCategories();
    }

    loadCategories() {
        this.isLoading = true;
        this.categoryService.getCategories().subscribe({
            next: (res: any) => {
                this.categories = res.data || res;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.categories = [];
            }
        });
    }

    // Create / Update Category
    saveCategory() {
        if (!this.currentCategory.name.trim()) return;

        this.isLoading = true;

        if (this.isEditing && this.currentCategory._id) {
            this.categoryService.updateCategory(this.currentCategory._id, { name: this.currentCategory.name }).subscribe({
                next: () => {
                    this.toastr.success('Category updated successfully');
                    this.resetForm();
                    this.loadCategories();
                    this.categoryChanged.emit();
                },
                error: (err) => {
                    this.toastr.error(err.error?.message || 'Error updating category');
                    this.isLoading = false;
                }
            });
        } else {
            this.categoryService.createCategory({ name: this.currentCategory.name }).subscribe({
                next: () => {
                    this.toastr.success('Category created successfully');
                    this.resetForm();
                    this.loadCategories();
                    this.categoryChanged.emit();
                },
                error: (err) => {
                    this.toastr.error(err.error?.message || 'Error creating category');
                    this.isLoading = false;
                }
            });
        }
    }

    editCategory(category: any) {
        this.isEditing = true;
        this.currentCategory = { _id: category._id, name: category.name };
    }

    deleteCategory(id: string) {
        this.isLoading = true;
        this.categoryService.deleteCategory(id).subscribe({
            next: () => {
                this.toastr.success('Category deleted successfully');
                this.loadCategories();
                this.categoryChanged.emit();
            },
            error: (err) => {
                this.toastr.error(err.error?.message || 'Error deleting category');
                this.isLoading = false;
            }
        });
    }

    resetForm() {
        this.isEditing = false;
        this.currentCategory = { _id: '', name: '' };
        this.isLoading = false;
    }

    // Subcategory Logic
    createSubCategory() {
        if (!this.newSubCategoryName.trim() || !this.selectedParentCategory) return;

        this.isLoading = true;
        this.categoryService.createSubCategory({
            name: this.newSubCategoryName,
            categoryId: this.selectedParentCategory
        }).subscribe({
            next: () => {
                this.toastr.success('Subcategory created successfully!');
                this.newSubCategoryName = '';
                this.selectedParentCategory = '';
                this.loadCategories();
                this.categoryChanged.emit();
            },
            error: (err) => {
                this.toastr.error(err.error?.message || 'Error creating subcategory');
                this.isLoading = false;
            }
        });
    }

    onClose() {
        this.close.emit();
    }
}
