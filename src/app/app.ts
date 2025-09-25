import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Products } from './components/products/products';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [  
    Header,
    Footer,
    Products
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ecommerceApp');
}
