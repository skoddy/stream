import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core/firebase.service';
import { AuthService } from '@app/core/auth.service';
import { ToastService } from '@app/core/toast.service';
import { Observable } from '@firebase/util';
import { filter } from 'rxjs/operator/filter';

export interface Status {
  status: string;
}
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  usersRef: any;
  users: any;
  constructor(private db: FirebaseService, private auth: AuthService, private toast: ToastService) {
    this.usersRef = db.colWithIds$('users');
    this.users = this.usersRef.map((users) => users.filter(user => user.uid !== this.auth.uid));


  }
/*   getEpics():Observable<Epic[]> {
    return this.http.get(this.url + "getEpics")
      .map(this.extractData)
      .catch(this.handleError);
  }
  getEpic(id: number): Observable<Epic> {
    return this.getEpics()
      .map(epics => epics.filter(epic => epic.id !== id)[0]);
  } */
  ngOnInit() {
  }

}
