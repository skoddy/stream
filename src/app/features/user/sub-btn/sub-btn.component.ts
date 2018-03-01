import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sub-btn',
  templateUrl: './sub-btn.component.html',
  styleUrls: ['./sub-btn.component.css']
})
export class SubBtnComponent {
  @Input() uid: string;
  constructor() { }


}
