import { Inject, Injectable } from '@angular/core';
import { FirebaseApp } from 'angularfire2';
import { FirebaseService } from '@app/core/firebase.service';
import { Observable } from 'rxjs/Observable';
import { AuthService } from '@app/core/auth.service';
import { User } from '../user-model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/map';
@Injectable()
export class UserService {
  usersRef$: Observable<User[]>;

  constructor(public db: FirebaseService,
    public auth: AuthService,
    @Inject(FirebaseApp) fb) {
    // Fill up the database with 100 users.
    this.usersRef$ = this.db.colWithIds$('users');
    this.usersRef$.map((users) => users.filter(user => user.uid !== this.auth.uid));

  }

}
@Injectable()
export class UserDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
  get data(): User[] { return this.dataChange.value; }
  private database = this.userService.db.colWithIds$('users');
  public getUsers(): Observable<User[]> {
    return this.database.map((users) => users.filter(user => user.uid !== this.userService.auth.uid));
  }
  constructor(private userService: UserService) {
    this.getUsers()
      .subscribe(data => this.dataChange.next(data));
  }
}

/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, ExampleDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
@Injectable()
export class UserDataSource extends DataSource<User> {
  constructor(private _userDatabase: UserDatabase, private paginator: MatPaginator) {
    super();
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<User[]> {
    // return this._userDatabase.dataChange;
    const displayDataChanges = [
      this._userDatabase.dataChange,
      this.paginator.page,
  ];

    return Observable
      .merge(...displayDataChanges) // Convert object to array with spread syntax.
      .map(() => {
        const dataSlice = this._userDatabase.data.slice(); // Data removed from viewed page.

        // Get the page's slice per pageSize setting.
        const startIndex = this.paginator.pageIndex * this.paginator.pageSize;

        const dataLength = this.paginator.length;  // This is for the counter on the DOM.

        return dataSlice.splice(startIndex, this.paginator.pageSize);
      });
  }

  disconnect() { }
}

