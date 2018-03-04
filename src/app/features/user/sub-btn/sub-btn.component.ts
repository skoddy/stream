import { Component, Input, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { ToastService } from '@app/core/toast.service';

export interface Subs {
  uid: string;
}

@Component({
  selector: 'app-sub-btn',
  templateUrl: './sub-btn.component.html',
  styleUrls: ['./sub-btn.component.css']
})
export class SubBtnComponent implements OnInit {

  subsDoc$: Observable<any>;
  sub: any;
  hasSubscribed: boolean;
  @Input() uid: string;
  constructor(public db: FirebaseService, public auth: AuthService, private toast: ToastService) {
    /*     this.subsDoc$ = this.db.doc(`users/${this.auth.uid}/subscriptions/${this._uid}`);
        this.sub = this.subsDoc$.valueChanges(); */

  }

  ngOnInit() {
    this.subsDoc$ = this.db.doc$(`users/${this.auth.uid}/subscriptions/${this.uid}`);
    this.sub = this.subsDoc$.subscribe((data) => {
      this.hasSubscribed = false;
      if (data && (data.uid === this.uid)) {
        this.hasSubscribed = true;
      }
    });

  }
  unSubscribeUser(uid: string) {
    console.log(`unsubbed user ${uid}`);
    this.db.delete(`users/${this.auth.uid}/subscriptions/${uid}`).then(() => this.toast.sendOkMsg('Posts nicht mehr Abonniert'));
  }
  subscribeUser(uid: string) {
    console.log(`subbed user ${uid}`);
    this.db.set(`users/${this.auth.uid}/subscriptions/${uid}`, { uid: uid }).then(() => this.toast.sendOkMsg('Posts Abonniert'));
  }
}
