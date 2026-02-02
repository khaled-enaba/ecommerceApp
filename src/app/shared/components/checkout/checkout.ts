import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { ProfileService } from '../../../core/services/profile.service';
import { Auth } from '../../../core/services/auth';
import { IAddress } from '../../model/profile.model';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './checkout.html',
    styleUrl: './checkout.css'
})
export class Checkout implements OnInit {
    private orderService = inject(OrderService);
    public cartService = inject(CartService);
    private profileService = inject(ProfileService);
    private router = inject(Router);
    private auth = inject(Auth);
    private toastr = inject(ToastrService);

    // Address management
    savedAddresses = signal<IAddress[]>([]);
    selectedAddressId = signal<string | null>(null);
    addressMode = signal<'select' | 'new'>('select'); // select existing or add new
    isLoadingAddresses = signal(false);

    // Current shipping address (for display and editing)
    shippingAddress = {
        addressLine: '',
        city: '',
        phone: '',
        type: 'home' as 'home' | 'office'
    };

    // Track if address was modified
    isAddressModified = signal(false);
    originalAddress: any = null;

    isSubmitting = false;

    get total() {
        return this.cartService.items().reduce((acc, item) => {
            const price = item.product?.price || 0;
            return acc + price * item.quantity;
        }, 0);
    }

    ngOnInit() {
        if (!this.auth.currentUser()) {
            this.toastr.error('Please login to place an order.');
            this.router.navigate(['/login']);
            return;
        }

        if (this.cartService.items().length === 0) {
            this.router.navigate(['/products']);
            return;
        }

        this.loadSavedAddresses();
    }

    loadSavedAddresses() {
        this.isLoadingAddresses.set(true);
        this.profileService.getAddresses().subscribe({
            next: (response) => {
                this.savedAddresses.set(response.data || []);

                // Auto-select default address if exists
                const defaultAddr = this.savedAddresses().find(addr => addr.isDefault);
                if (defaultAddr) {
                    this.selectAddress(defaultAddr._id!);
                } else if (this.savedAddresses().length > 0) {
                    // Select first address if no default
                    this.selectAddress(this.savedAddresses()[0]._id!);
                }

                this.isLoadingAddresses.set(false);
            },
            error: (err) => {
                console.error('Error loading addresses:', err);
                this.isLoadingAddresses.set(false);
            }
        });
    }

    selectAddress(addressId: string) {
        const address = this.savedAddresses().find(a => a._id === addressId);
        if (address) {
            this.selectedAddressId.set(addressId);
            this.addressMode.set('select');
            this.shippingAddress = {
                addressLine: address.addressLine,
                city: address.city,
                phone: address.phone || '',
                type: (address.type === 'other' ? 'home' : address.type) as 'home' | 'office'
            };
            // Store original for comparison
            this.originalAddress = { ...this.shippingAddress };
            this.isAddressModified.set(false);
        }
    }

    onAddressFieldChange() {
        if (this.addressMode() === 'select' && this.originalAddress) {
            // Check if modified
            const isModified =
                this.shippingAddress.addressLine !== this.originalAddress.addressLine ||
                this.shippingAddress.city !== this.originalAddress.city ||
                this.shippingAddress.phone !== this.originalAddress.phone;
            this.isAddressModified.set(isModified);
        }
    }

    switchToNewAddress() {
        this.addressMode.set('new');
        this.selectedAddressId.set(null);
        this.shippingAddress = {
            addressLine: '',
            city: '',
            phone: '', // Empty, user will fill it
            type: 'home'
        };
        this.isAddressModified.set(false);
        this.originalAddress = null;
    }

    saveAddressChanges() {
        if (!this.selectedAddressId()) return;

        const updateData = {
            addressLine: this.shippingAddress.addressLine,
            city: this.shippingAddress.city,
            phone: this.shippingAddress.phone,
            type: this.shippingAddress.type,
            isDefault: false // Don't change default status
        };

        this.profileService.updateAddress(this.selectedAddressId()!, updateData).subscribe({
            next: (response) => {
                this.toastr.success('Address updated successfully!');
                this.loadSavedAddresses();
                this.isAddressModified.set(false);
            },
            error: (err) => {
                console.error('Error updating address:', err);
                this.toastr.error('Failed to update address');
            }
        });
    }

    placeOrder() {
        if (!this.shippingAddress.addressLine || !this.shippingAddress.city || !this.shippingAddress.phone) {
            this.toastr.warning('Please fill in all shipping details.');
            return;
        }

        // If new address, save it first
        if (this.addressMode() === 'new') {
            this.saveNewAddressThenOrder();
        } else {
            this.createOrder();
        }
    }

    private saveNewAddressThenOrder() {
        const newAddressData = {
            addressLine: this.shippingAddress.addressLine,
            city: this.shippingAddress.city,
            phone: this.shippingAddress.phone,
            type: this.shippingAddress.type,
            isDefault: this.savedAddresses().length === 0 // Set as default if first address
        };

        this.profileService.addAddress(newAddressData).subscribe({
            next: (response) => {
                console.log('New address saved:', response);
                this.createOrder();
            },
            error: (err) => {
                console.error('Error saving address:', err);
                this.toastr.error('Failed to save address. Please try again.');
                this.isSubmitting = false;
            }
        });
    }

    private createOrder() {
        this.isSubmitting = true;

        const orderData = {
            shippingAddress: this.shippingAddress
        };

        console.log('Placing order with data:', orderData);

        this.orderService.createOrder(orderData).subscribe({
            next: (res) => {
                console.log('Order created successfully:', res);
                this.toastr.success('Order placed successfully! Thank you for your purchase.');
                this.cartService.loadCart(); // Reload cart to clear it (backend clears it)
                this.router.navigate(['/home']);
            },
            error: (err) => {
                console.error('Error placing order:', err);
                this.toastr.error(err.error?.message || 'Failed to place order. Please try again.');
                this.isSubmitting = false;
            }
        });
    }
}
