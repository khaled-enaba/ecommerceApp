import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../core/services/user.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, switchMap, catchError, of, map } from 'rxjs';
import { IUser, IUserData } from '../../shared/model/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  private userService = inject(UserService);
  private toastr = inject(ToastrService);

  // Reload trigger for refreshing user list
  private reloadTrigger = new BehaviorSubject<void>(undefined);

  // Loading state
  private _isLoading = signal(true);

  // Fetch users reactively
  private usersData = toSignal(
    this.reloadTrigger.pipe(
      switchMap(() => {
        this._isLoading.set(true);
        return this.userService.getUsers();
      }),
      map(res => {
        this._isLoading.set(false);
        return res.data || [];
      }),
      catchError(err => {
        console.error('Error loading users:', err);
        this._isLoading.set(false);
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  // Public computed signals
  users = computed(() => this.usersData() || []);
  isLoading = computed(() => this._isLoading());

  // Search/filter
  filterQuery = signal('');
  filteredUsers = computed(() => {
    const query = this.filterQuery().toLowerCase().trim();
    const allUsers = this.users();

    if (!query) return allUsers;

    return allUsers.filter((u: IUserData) =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  // Modal states
  showModal = signal(false);
  showPasswordModal = signal(false);
  isEditing = signal(false);
  currentUser = signal<Partial<IUserData> & { password?: string }>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true
  });
  newPassword = signal('');

  // Modal actions
  openAddModal(role: 'USER' | 'ADMIN' = 'USER') {
    this.isEditing.set(false);
    this.currentUser.set({
      name: '',
      email: '',
      password: '',
      role,
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(user: IUserData) {
    this.isEditing.set(true);
    this.currentUser.set({ ...user });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  openPasswordModal(user: IUserData) {
    this.currentUser.set({ ...user });
    this.newPassword.set('');
    this.showPasswordModal.set(true);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
  }

  // CRUD operations
  saveUser() {
    const user = this.currentUser();

    if (!user.name || !user.email) {
      this.toastr.warning('Please fill in all required fields');
      return;
    }

    if (this.isEditing()) {
      // Update existing user
      this.userService.updateUser(user.id!, user).subscribe({
        next: () => {
          this.reloadTrigger.next();
          this.closeModal();
          this.toastr.success('User updated successfully');
        },
        error: (err: any) => this.toastr.error(err.error?.message || 'Update failed')
      });
    } else {
      // Create new user
      if (!user.password) {
        this.toastr.warning('Password is required for new users');
        return;
      }

      const obs = user.role === 'ADMIN'
        ? this.userService.createAdmin(user)
        : this.userService.createUser(user);

      obs.subscribe({
        next: () => {
          this.reloadTrigger.next();
          this.closeModal();
          this.toastr.success(`${user.role} created successfully`);
        },
        error: (err: any) => this.toastr.error(err.error?.message || 'Creation failed')
      });
    }
  }

  deleteUser(id: string) {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.reloadTrigger.next();
        this.toastr.success('User deleted successfully');
      },
      error: (err: any) => this.toastr.error(err.error?.message || 'Delete failed')
    });
  }

  savePassword() {
    const pwd = this.newPassword();
    if (!pwd || pwd.length < 6) {
      this.toastr.warning('Please enter a valid password (minimum 6 characters)');
      return;
    }

    this.userService.resetPassword(this.currentUser().id!, pwd).subscribe({
      next: () => {
        this.closePasswordModal();
        this.toastr.success('Password updated successfully');
      },
      error: (err: any) => this.toastr.error(err.error?.message || 'Failed to update password')
    });
  }

  // Utility
  getAvatarColor(name: string): string {
    if (!name) return '#667eea';
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  }
}
