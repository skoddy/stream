import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';

// For MD Data Table.
import { MatPaginator } from '@angular/material';
import { UserService, UserDataSource, UserDatabase } from '@app/core';

import { User } from '../../../user-model';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  private result: boolean;
  user: User[];
  users: User[];

  startAt = new Subject();
  endAt = new Subject();
  lastKeypress: 0;
  dataSource: UserDataSource | null;
  displayedColumns = [
    'uid',
    'displayName'
  ];
  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  public dataLength: any;
  constructor(
    private userService: UserService,
    private userDatabase: UserDatabase
  ) { }
  ngOnInit() {
    this.userDatabase.getUsers()
    .subscribe(members => {
        this.dataSource = new UserDataSource(this.userDatabase, this.paginator);
        this.dataLength = members;
    });
  }

}
