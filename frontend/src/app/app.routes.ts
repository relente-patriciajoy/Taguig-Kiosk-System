import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing';
import { CheckinComponent } from './checkin/checkin';
import { CheckoutComponent } from './checkout/checkout';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'checkin', component: CheckinComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: '**', redirectTo: '' }
];