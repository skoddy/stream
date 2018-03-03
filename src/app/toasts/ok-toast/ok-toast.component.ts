import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material';

@Component({
  selector: 'app-ok-toast',
  templateUrl: './ok-toast.component.html',
  styleUrls: ['./ok-toast.component.css']
})
export class OkToastComponent {

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) { }


}
