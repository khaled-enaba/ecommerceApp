import { Component } from '@angular/core';
import { Iproduct } from '../../model/iproduct';
import { CommonModule } from '@angular/common';
import { Icategory } from '../../model/icategory';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule], 
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products {
  products:Iproduct[];
  categories:Icategory[];
  selectCatId:number=0;
  totalprice:number=0;

  constructor() {
    this.products = [
      {
        id: 1,
        name: 'Iphone 14 Pro',
        price: 1000,
        description: 'Latest Apple iPhone with advanced features',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 2,
        quantity: 7
      },
      {
        id: 2,
        name: 'iPhone 13 Pro',
        price: 900,
        description: 'Previous generation iPhone with great features',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 2,
        quantity: 4
      },
      {
        id: 3,
        name: 'iPhone 12 Pro',
        price: 800,
        description: 'Older generation iPhone with solid performance',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 2,
        quantity: 4
      },
      {
        id: 4,
        name: 'iPhone 11 Pro',
        price: 700,
        description: 'Older generation iPhone with decent performance',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 2,
        quantity: 1
      },
      {
        id: 5,
        name: 'samsung Galaxy S10',
        price: 700,
        description: 'Samsung flagship phone with great features',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 2,
        quantity: 5
      },
      {
        id: 6,
        name: 'samsung Galaxy S20',
        price: 900,
        description: 'Samsung flagship phone with improved features',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 2,
        quantity: 5
      },
      {
        id: 7,
        name: 'redmi Note 11s',
        price: 400,
        description: 'Affordable smartphone with good performance',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 2,
        quantity: 5
      },
      {
        id: 8,
        name: 'redmi Note 10',
        price: 300,
        description: 'Budget smartphone with decent features',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 2,
        quantity: 5
      },
      {
        id: 9,
        name: 'ipad Air',
        price: 750,
        description: 'Apple tablet with high resolution display',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 1,
        quantity: 5
      },
      {
        id: 10,
        name: 'samsung Tab S7',
        price: 950,
        description: 'Samsung tablet with high resolution display',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 1,
        quantity: 5
      },
      {
        id: 11,
        name: 'Macbook Air',
        price: 1200,
        description: 'Apple laptop with M1 chip',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 3,
        quantity: 5
      },
      {
        id: 12,
        name: 'Macbook Pro',
        price: 1500,
        description: 'Apple laptop with M1 Pro chip',
        imageUrl: 'https://fakeimg.pl/300/',
        catId: 3,
        quantity: 0
      },

    ];
    this.categories = [
      { id: 2, name: 'mobile' },
      { id: 1, name: 'tablet' },
      { id: 3, name: 'laptop' }
    ];
  }

  buy( count:string, price: number) {
    this.totalprice +=parseInt(count) * price;  
  }
}
