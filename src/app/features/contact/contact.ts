import { Component, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contact',
  imports: [],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  private toastr = inject(ToastrService);

  onSubmit() {
    this.toastr.success('Thank you for contacting us! We will get back to you shortly.');
  }
}
