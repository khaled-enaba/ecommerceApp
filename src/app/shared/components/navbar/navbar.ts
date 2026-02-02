import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBar } from '../search-bar/search-bar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, SearchBar, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements AfterViewInit {
  @ViewChild('navMenu') navMenu!: ElementRef;
  @ViewChild('searchBar') searchBar!: ElementRef;

  showSearch = false;
  cartService = inject(CartService);
  auth = inject(Auth);

  toggleSearch() {
    this.showSearch = !this.showSearch;
  }
  ngAfterViewInit() {
    // DOM is ready here
  }

  toggleMenu() {
    this.navMenu.nativeElement.classList.toggle('show');
  }

  onLogout() {
    this.auth.logout();
  }

  logo = "/assets/brand/logo.png";
}
