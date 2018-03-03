import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { ToastService } from '@app/core/toast.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {


  usersO$: any;
  usersR: any;
  userDoc: any;
  user: any;
  constructor(private db: FirebaseService, private toast: ToastService) { }

  ngOnInit() {
    this.userDoc = this.db.doc('users/ufTovvdfDDUASDSTzaWtjZ3Wif62');
    this.user = this.userDoc.valueChanges();
    this.usersR = this.getUsersRef();
    this.usersO$ = this.getUsersOb();
  }
  get userId() {
    return this.userDoc.ref.id;
  }
  getUsersRef() {
    const userRef = this.db.col('users');
    return userRef.valueChanges();
  }
  getUsersOb() {
    return this.db.col$('users');
  }
  fail() {
    this.toast.sendFailMsg('asd');
  }
  ok() {
    this.toast.sendOkMsg('asd');
  }
}
