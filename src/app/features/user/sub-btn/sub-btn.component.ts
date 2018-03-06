import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { ToastService } from '@app/core/toast.service';
import { Subscription } from 'rxjs/Subscription';
export interface Subs {
  uid: string;
}

@Component({
  selector: 'app-sub-btn',
  templateUrl: './sub-btn.component.html',
  styleUrls: ['./sub-btn.component.css']
})
export class SubBtnComponent implements OnInit {

  toggleFollowRef: any;
  subsDoc$: Observable<any>;
  sub: any;
  hasSubscribed: boolean;
  @Input() uid: string;
  constructor(public db: FirebaseService, public auth: AuthService, private toast: ToastService) {
    /*     this.subsDoc$ = this.db.doc(`users/${this.auth.uid}/subscriptions/${this._uid}`);
        this.sub = this.subsDoc$.valueChanges(); */

  }

  ngOnInit() {
    this.subsDoc$ = this.db.doc$(`followers/${this.auth.uid}_${this.uid}`);
    this.sub = this.subsDoc$.subscribe((data) => {
      this.hasSubscribed = false;
      if (data && data.follow === true) {
        console.log(data.follow);
        this.hasSubscribed = true;
      }
    });

  }

  OnDestroy() {

  }

  toggleFollowUser(followedUserId, follow?) {
    const followRef = this.db.colWithIds$(`/people/${followedUserId}/posts`, ref => ref.orderBy('createdAt', 'desc'));
    this.toggleFollowRef = followRef.subscribe(data => {
      const updateData = {};
      let lastPostId: string;
      let batchType = '';
      if (follow) {
        console.log('follow: ' + followedUserId);
        batchType = 'set';
        // Add/remove followed user's posts to the home feed.
        data.forEach(post => {
          updateData[`/feed/${this.auth.uid}/posts/${post.id}`] = post;
          lastPostId = post.createdAt;
          console.log('lastpostId: ' + lastPostId);
        });
        // Add/remove followed user to the 'following' list.
        updateData[`/people/${this.auth.uid}/following/${followedUserId}`] = {
          lastPost: lastPostId
        };
        // Add/remove signed-in user to the list of followers.
        updateData[`/followers/${this.auth.uid}_${followedUserId}`] = {
          follow: follow ? !!follow : null
        };
        this.db.batch(updateData, batchType);
      } else {
        console.log('unfollow: ' + followedUserId);
        batchType = 'delete';
        // Add/remove followed user's posts to the home feed.
        data.forEach(post => {
          updateData[`/feed/${this.auth.uid}/posts/${post.id}`] = true;
        });
        // Add/remove followed user to the 'following' list.
        updateData[`/people/${this.auth.uid}/following/${followedUserId}`] = true;
        // Add/remove signed-in user to the list of followers.
        updateData[`/followers/${this.auth.uid}_${followedUserId}`] = true;
        this.db.batch(updateData, batchType);
      }
      this.toggleFollowRef.unsubscribe();
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
