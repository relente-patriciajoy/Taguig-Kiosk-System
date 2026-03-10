import { Routes } from '@angular/router';
import { LanguageSelectComponent } from './language-select/language-select';
import { TermsComponent }          from './terms/terms';
import { LandingComponent }        from './landing/landing';
import { CheckinComponent }        from './checkin/checkin';
import { CheckoutComponent }       from './checkout/checkout';

export const routes: Routes = [
  { path: '',         component: LanguageSelectComponent },
  { path: 'terms',    component: TermsComponent          },
  { path: 'home',     component: LandingComponent        },
  { path: 'checkin',  component: CheckinComponent        },
  { path: 'checkout', component: CheckoutComponent       },
  { path: '**',       redirectTo: ''                     }
];