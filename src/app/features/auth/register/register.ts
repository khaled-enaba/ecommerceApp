import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
 registerForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private _authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, this.emailValidator.bind(this)]],
      phone: ['', [Validators.required, this.phoneValidator.bind(this)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, { validators: this.passwordMatchValidator });
  }

  private emailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    
    // RFC 5322 compliant email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email) && 
                    email.length >= 5 && 
                    !email.startsWith('.') && 
                    !email.endsWith('.');
    
    if (!isValid) {
      return { invalidEmail: true };
    }
    return null;
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    const phone = control.value;
    if (!phone) return null;
    
    // International phone format validation (supports +1-999-999-9999 or 10 digits)
    const phoneRegex = /^(\+\d{2}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$|^\d{10}$/;
    const isValid = phoneRegex.test(phone.replace(/\s/g, ''));
    
    if (!isValid) {
      return { invalidPhone: true };
    }
    return null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value 
      ? { passwordMismatch: true } : null;
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      console.log(this.registerForm.value)
      this.registerForm.markAsPristine();
      return;
    }
    this.isLoading = true;
    this._authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error.message;
      }
    })
  }
}