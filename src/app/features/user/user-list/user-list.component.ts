import { Component, OnInit } from '@angular/core';

export interface Status {
  status: string;
}
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  constructor() {

  }

  ngOnInit() {
  }

}
