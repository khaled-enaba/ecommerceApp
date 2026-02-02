import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { OrderService } from '../../core/services/order.service';
import { IAddress } from '../../shared/model/profile.model';
import { IOrder } from '../../shared/model/order.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);

  // State
  isLoading = signal(false);
  isEditing = signal(false);
  userData = signal<any>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Password change state
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmNewPassword = signal(false);
  passwordChangeSuccess = signal<string | null>(null);
  passwordChangeError = signal<string | null>(null);
  isChangingPassword = signal(false);

  // Addresses
  addresses = signal<IAddress[]>([]);
  isEditingAddresses = signal(false);
  isLoadingAddresses = signal(false);
  addressesErrorMessage = signal<string | null>(null);
  addressesSuccessMessage = signal<string | null>(null);

  // Last Order
  lastOrder = signal<IOrder | null>(null);
  isLoadingOrder = signal(false);
  orderErrorMessage = signal<string | null>(null);
  orderSuccessMessage = signal<string | null>(null);
  isCancellingOrder = signal(false);

  // Orders History
  allOrders = signal<IOrder[]>([]);
  isLoadingHistory = signal(false);

  // Forms
  profileForm!: FormGroup;
  changePasswordForm!: FormGroup;

  ngOnInit() {
    this.loadUserProfile();
    this.loadAddresses();
    this.loadOrdersData();
    this.initializeForm();
  }

  private initializeForm() {
    // Profile form - without password fields
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10,}$/)]]
    });

    // Separate password change form
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(6)]]
    }, { validators: this.newPasswordMatchValidator });
  }

  private newPasswordMatchValidator(form: any): { [key: string]: any } | null {
    const password = form.get('password')?.value;
    const passwordConfirm = form.get('passwordConfirm')?.value;

    if (password && passwordConfirm && password !== passwordConfirm) {
      return { passwordMismatch: true };
    }

    return null;
  }

  private loadUserProfile() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.profileService.getProfile().subscribe({
      next: (response) => {
        console.log('Profile loaded:', response);
        this.userData.set(response.data);
        this.profileForm.patchValue({
          name: response.data?.name,
          email: response.data?.email,
          mobile: response.data?.mobile
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage.set('Failed to load profile. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  toggleEditMode() {
    if (this.isEditing()) {
      // Cancel editing - reset form
      this.profileForm.patchValue({
        name: this.userData()?.name,
        email: this.userData()?.email,
        mobile: this.userData()?.mobile
      });
    }
    this.isEditing.set(!this.isEditing());
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.errorMessage.set('Please fix the errors in the form');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Prepare data for update (no password)
    const formValue = this.profileForm.value;
    const updateData: any = {
      name: formValue.name,
      email: formValue.email,
      mobile: formValue.mobile
    };

    this.profileService.updateProfile(updateData).subscribe({
      next: (response) => {
        console.log('Profile updated:', response);
        this.userData.set(response.data);
        this.successMessage.set('✓ Profile updated successfully!');
        this.isEditing.set(false);
        this.isLoading.set(false);

        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.errorMessage.set(error?.error?.message || 'Failed to update profile');
        this.isLoading.set(false);
      }
    });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.errorMessage.set(null);
    this.profileForm.patchValue({
      name: this.userData()?.name,
      email: this.userData()?.email,
      mobile: this.userData()?.mobile
    });
    // Reset password form when canceling
    this.changePasswordForm.reset();
    this.passwordChangeError.set(null);
    this.passwordChangeSuccess.set(null);
  }

  // Password visibility toggles
  toggleCurrentPasswordVisibility() {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmNewPasswordVisibility() {
    this.showConfirmNewPassword.set(!this.showConfirmNewPassword());
  }

  // Change Password Method
  changePassword() {
    if (this.changePasswordForm.invalid) {
      this.passwordChangeError.set('Please fill all password fields correctly');
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordChangeError.set(null);
    this.passwordChangeSuccess.set(null);

    const formValue = this.changePasswordForm.value;
    const passwordData = {
      currentPassword: formValue.currentPassword,
      password: formValue.password,
      passwordConfirm: formValue.passwordConfirm
    };

    this.profileService.changePassword(passwordData).subscribe({
      next: (response) => {
        console.log('Password changed:', response);
        this.passwordChangeSuccess.set('✓ Password changed successfully!');
        this.isChangingPassword.set(false);
        this.changePasswordForm.reset();

        // Clear success message after 3 seconds
        setTimeout(() => this.passwordChangeSuccess.set(null), 3000);
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.passwordChangeError.set(error?.error?.message || 'Failed to change password');
        this.isChangingPassword.set(false);
      }
    });
  }

  // Address Methods
  private loadAddresses() {
    this.isLoadingAddresses.set(true);
    this.addressesErrorMessage.set(null);

    this.profileService.getAddresses().subscribe({
      next: (response) => {
        console.log('Addresses loaded:', response);
        this.addresses.set(response.data || []);
        this.isLoadingAddresses.set(false);
      },
      error: (error) => {
        console.error('Error loading addresses:', error);
        this.addressesErrorMessage.set('Failed to load addresses');
        this.isLoadingAddresses.set(false);
      }
    });
  }

  toggleEditAddresses() {
    this.isEditingAddresses.set(!this.isEditingAddresses());
    this.addressesErrorMessage.set(null);
    this.addressesSuccessMessage.set(null);
  }

  getDefaultAddress(): IAddress | undefined {
    return this.addresses().find(addr => addr.isDefault);
  }

  getOtherAddresses(): IAddress[] {
    return this.addresses().filter(addr => !addr.isDefault);
  }

  setDefaultAddress(addressId: string) {
    this.isLoadingAddresses.set(true);
    this.addressesErrorMessage.set(null);
    this.addressesSuccessMessage.set(null);

    this.profileService.setDefaultAddress(addressId).subscribe({
      next: (response) => {
        console.log('Default address set:', response);
        this.loadAddresses();
        this.addressesSuccessMessage.set('✓ Default address updated!');
        setTimeout(() => this.addressesSuccessMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error setting default address:', error);
        this.addressesErrorMessage.set('Failed to set default address');
        this.isLoadingAddresses.set(false);
      }
    });
  }

  deleteAddress(addressId: string) {
    this.isLoadingAddresses.set(true);
    this.addressesErrorMessage.set(null);

    this.profileService.deleteAddress(addressId).subscribe({
      next: (response) => {
        console.log('Address deleted:', response);
        this.loadAddresses();
        this.addressesSuccessMessage.set('✓ Address deleted successfully!');
        setTimeout(() => this.addressesSuccessMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error deleting address:', error);
        this.addressesErrorMessage.set('Failed to delete address');
        this.isLoadingAddresses.set(false);
      }
    });
  }

  // Last Order & History Methods
  private loadOrdersData() {
    this.isLoadingOrder.set(true);
    this.isLoadingHistory.set(true);
    this.orderErrorMessage.set(null);

    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        console.log('Orders loaded:', response);
        const orders = Array.isArray(response) ? response : response.data || [];

        if (orders.length > 0) {
          const sorted = orders.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.lastOrder.set(sorted[0]);
          this.allOrders.set(sorted);
        }

        this.isLoadingOrder.set(false);
        this.isLoadingHistory.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.orderErrorMessage.set('Failed to load order information');
        this.isLoadingOrder.set(false);
        this.isLoadingHistory.set(false);
      }
    });
  }
  getImageUrl(filename: string | undefined): string {
    if (!filename) return '';
    return `${environment.STATIC_URL}${filename}`;
  }

  canCancelOrder(): boolean {
    return this.lastOrder()?.status === 'pending';
  }

  canCancelOrderByStatus(status: string): boolean {
    return status === 'pending';
  }

  cancelLastOrder() {
    const orderId = this.lastOrder()?._id;
    if (!orderId) return;

    this.isCancellingOrder.set(true);
    this.orderErrorMessage.set(null);
    this.orderSuccessMessage.set(null);

    this.orderService.cancelOrder(orderId).subscribe({
      next: (response) => {
        console.log('Order cancelled:', response);
        this.lastOrder.set(response);
        this.orderSuccessMessage.set('✓ Order cancelled successfully!');
        this.isCancellingOrder.set(false);
        this.loadOrdersData();
        setTimeout(() => this.orderSuccessMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.orderErrorMessage.set('Failed to cancel order');
        this.isCancellingOrder.set(false);
      }
    });
  }

  cancelOrderFromHistory(orderId: string) {
    this.isLoadingHistory.set(true);
    this.orderErrorMessage.set(null);

    this.orderService.cancelOrder(orderId).subscribe({
      next: (response) => {
        console.log('Order cancelled:', response);
        this.orderSuccessMessage.set('✓ Order cancelled successfully!');
        this.loadOrdersData();
        setTimeout(() => this.orderSuccessMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.orderErrorMessage.set('Failed to cancel order');
        this.isLoadingHistory.set(false);
      }
    });
  }

  isReturningOrder = signal(false);

  canReturnOrder(status: string): boolean {
    return status === 'received';
  }

  returnLastOrder() {
    const orderId = this.lastOrder()?._id;
    if (!orderId) return;

    const reason = prompt('Please enter the reason for return:');
    if (!reason) return; // Cancel if no reason provided

    this.isReturningOrder.set(true);
    this.orderErrorMessage.set(null);
    this.orderSuccessMessage.set(null);

    this.orderService.returnOrder(orderId, reason).subscribe({
      next: (response) => {
        console.log('Order return requested:', response);
        this.orderSuccessMessage.set('✓ Return request submitted successfully!');
        this.isReturningOrder.set(false);
        this.loadOrdersData();
        setTimeout(() => this.orderSuccessMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error returning order:', error);
        this.orderErrorMessage.set(error?.error?.message || 'Failed to submit return request');
        this.isReturningOrder.set(false);
      }
    });
  }

  returnOrderFromHistory(orderId: string) {
    const reason = prompt('Please enter the reason for return:');
    if (!reason) return;

    this.isLoadingHistory.set(true);
    this.orderErrorMessage.set(null);

    this.orderService.returnOrder(orderId, reason).subscribe({
      next: (response) => {
        console.log('Order return requested:', response);
        this.orderSuccessMessage.set('✓ Return request submitted successfully!');
        this.loadOrdersData();
        setTimeout(() => this.orderSuccessMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error returning order:', error);
        this.orderErrorMessage.set(error?.error?.message || 'Failed to submit return request');
        this.isLoadingHistory.set(false);
      }
    });
  }

  getOrderStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      pending: '#ff9800',
      preparing: '#2196f3',
      shipped: '#9c27b0',
      received: '#4caf50',
      cancelled: '#f44336',
      returned: '#795548'
    };
    return statusColors[status] || '#999';
  }

  getOrderStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      pending: '⏳',
      preparing: '📦',
      shipped: '🚚',
      received: '✅',
      cancelled: '❌',
      returned: '🔙'
    };
    return statusIcons[status] || '•';
  }
}
