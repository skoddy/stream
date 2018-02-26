import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-user-status',
  templateUrl: './user-status.component.html',
  styleUrls: ['./user-status.component.css']
})
export class UserStatusComponent implements OnInit {
@Input() user;
  constructor() { }

  ngOnInit() {
  }

}
