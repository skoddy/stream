import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material';

@Component({
  selector: 'app-fail-toast',
  templateUrl: './fail-toast.component.html',
  styleUrls: ['./fail-toast.component.css']
})
export class FailToastComponent {

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) { }


}
