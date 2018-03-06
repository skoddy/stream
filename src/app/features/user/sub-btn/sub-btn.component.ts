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
    this.subsDoc$ = this.db.doc$(`people/${this.auth.uid}/following/${this.uid}`);
    this.sub = this.subsDoc$.subscribe((data) => {
      this.hasSubscribed = false;
      if (data && (data.uid === this.uid)) {
        this.hasSubscribed = true;
      }
    });

  }
  toggleFollowUser(followedUserId, follow?) {
    console.log('<Toggle Follow User>');
    // Add or remove posts to the user's home feed.
    console.log('toggle: ' + followedUserId);
    return this.db.col(`/people/${followedUserId}/posts`).auditTrail()
      .map(actions => {
        return actions.map(posts => {
          const data = posts.payload.doc.data();
          const id = posts.payload.doc.id;
          const updateData = {};
          const deleteData = {};
          let lastPostId = true;
          console.log('toggle data: ' + data);
          // Add/remove followed user's posts to the home feed.
          if (follow) {
            console.log('followed update data: ' + id);
            updateData[`/feed/${this.auth.uid}/posts/${id}`] = data;
            updateData[`/people/${this.auth.uid}/following/${followedUserId}`] = {uid: followedUserId};
          } else {
            console.log('unfollowed delete data: ' + id);
            deleteData[`/feed/${this.auth.uid}/posts/${id}`] = true;
            deleteData[`/people/${this.auth.uid}/following/${followedUserId}`] = true;
          }

          lastPostId = id;




          // Add/remove signed-in user to the list of followers.
          // updateData[`/followers/${followedUserId}/${this.auth.uid}`] =
          //     follow ? !!follow : null;
          this.db.batch(deleteData, 'delete');
          this.db.batch(updateData, 'set');
          return { id, ...data };
        });
      }).subscribe(console.log('</Toggle Follow User>'));

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
