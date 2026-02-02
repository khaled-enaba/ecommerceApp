import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { ProductsList } from './features/products-list/products-list';
import { About } from './features/about/about';
import { Contact } from './features/contact/contact';
import { Cart } from './shared/components/cart/cart';
import { dashboard_routes } from './dashboard/dashboard.routes';
import { authRoute } from './features/auth/auth.routes';
import { adminGuard, authGuard } from './core/guards/auth.guard';
import { ProfileComponent } from './features/profile/profile';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: ProductsList },
      { path: 'products', loadComponent: () => import('./features/catalog/catalog').then(m => m.Catalog) },
      { path: 'products/:id', loadComponent: () => import('./features/product-details/product-details').then(m => m.ProductDetails) },
      { path: 'about', component: About },
      { path: 'contact', component: Contact },
      {path:'profile', component:ProfileComponent},
      { path: 'cart', component: Cart },
      {path: 'best-sellers', loadComponent: () => import('./shared/components/best-seller/best-seller').then(m => m.BestSeller)},
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () => import('./shared/components/checkout/checkout').then(m => m.Checkout)
      },
      {path: 'newarrivals', loadComponent: () => import('./shared/components/new-arrival/new-arrival').then(m => m.NewArrival)},
      {
        path: 'profile',
        canActivate: [authGuard],
        component: ProfileComponent
      }
    ]
  },
  { path: '', children: authRoute },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    children: dashboard_routes
  },
  {
    path: '**', component:ProductsList
  },

];
