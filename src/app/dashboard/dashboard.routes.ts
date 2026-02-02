import { Routes } from "@angular/router";
import { Home as DashboardHome } from "./home/home";
import { Dashboard } from "./dashboard";
import { Orders } from "./orders/orders";
import { Products } from "./products/products";
import { Reports } from "./reports/reports";
import { Users } from "./users/users";
import { Categories } from "./categories/categories";
import { Reviews } from "./reviews/reviews";
import { ProfileComponent } from "../features/profile/profile";
import { ReturnManagement } from "./return-management/return-management";


export const dashboard_routes: Routes = [

    {
        path: '',
        component: Dashboard,
        children: [
            { path: 'home', component: DashboardHome },
            { path: 'orders', component: Orders },
            { path: 'returns', component: ReturnManagement },
            { path: 'products', component: Products },
            { path: 'reports', component: Reports },
            { path: 'users', component: Users },
            { path: 'categories', component: Categories },
            { path: 'reviews', component: Reviews },
            { path: 'profile', component: ProfileComponent },
            { path: 'returns', component: ReturnManagement },

            { path: '', redirectTo: 'home', pathMatch: 'full' },
        ]
    },


]