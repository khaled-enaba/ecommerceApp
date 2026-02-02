import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-sidbar',
  imports: [RouterLink],
  templateUrl: './sidbar.html',
  styleUrl: './sidbar.css',
})
export class Sidbar {

  constructor(private auth: Auth) { }



  onLogout() {
    this.auth.logout();
  }


}
