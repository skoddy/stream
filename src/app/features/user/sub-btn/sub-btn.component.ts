import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { ToastService } from '@app/core/toast.service';
import { Subscription } from 'rxjs/Subscription';
import { AngularFirestoreDocument, AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import * as firebase from 'firebase/app';
export interface Subs {
  uid: string;
}
export interface Post {
  id: string;
  uid: string;
  createdAt: string;
  content: string;
  category: string;
  author: {
    displayName: string;
    photoURL: string;
  };
}
@Component({
  selector: 'app-sub-btn',
  templateUrl: './sub-btn.component.html',
  styleUrls: ['./sub-btn.component.css']
})
export class SubBtnComponent implements OnInit {
  unfollow: Subscription;
  follow: Subscription;
  private itemsCollection: AngularFirestoreCollection<Post>;
  items: Observable<Post[]>;
  toggleFollowRef: any;
  subsDoc$: Observable<any>;
  sub: any;
  hasSubscribed: boolean;
  @Input() uid: string;
  constructor(public db: FirebaseService,
    public auth: AuthService,
    private toast: ToastService,
    private afs: AngularFirestore) {
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

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  followUser(followedUserId) {
    const batch = firebase.firestore().batch();
    this.itemsCollection = this.afs.collection<Post>(`/people/${followedUserId}/posts`, ref => ref.orderBy('createdAt', 'desc'));
    this.items = this.itemsCollection.valueChanges();

    this.follow = this.items.subscribe(data => {
      let lastPostId: string;
      console.log('follow: ' + followedUserId);
      // Add followed user's posts to the home feed.
      data.forEach(post => {
        const postsRef = firebase.firestore().doc(`/feed/${this.auth.uid}/posts/${post.id}`);
        batch.set(postsRef, post);
        lastPostId = post.createdAt;
        console.log('lastpostId: ' + lastPostId);
      });
      // Add followed user to the 'following' list.
      const followingRef = firebase.firestore().doc(`/people/${this.auth.uid}/following/${followedUserId}`);
      batch.set(followingRef, { lastPost: lastPostId });
      // Add signed-in user to the list of followers.
      const followRef = firebase.firestore().doc(`/followers/${this.auth.uid}_${followedUserId}`);
      batch.set(followRef, { follow: true });
      this.follow.unsubscribe();
      return batch.commit();
    });
  }

  unFollowUser(followedUserId) {
    const batch = firebase.firestore().batch();
    this.itemsCollection = this.afs.collection<Post>(`/people/${followedUserId}/posts`, ref => ref.orderBy('createdAt', 'desc'));
    this.items = this.itemsCollection.valueChanges();
    this.unfollow = this.items.subscribe(data => {
      const updateData = {};
      console.log('unfollow: ' + followedUserId);
      // Remove followed user's posts to the home feed.
      data.forEach(post => {
        const postsRef = firebase.firestore().doc(`/feed/${this.auth.uid}/posts/${post.id}`);
        batch.delete(postsRef);
      });
      // Remove followed user to the 'following' list.
      const followingRef = firebase.firestore().doc(`/people/${this.auth.uid}/following/${followedUserId}`);
      batch.delete(followingRef);
      // Remove signed-in user to the list of followers.
      const followRef = firebase.firestore().doc(`/followers/${this.auth.uid}_${followedUserId}`);
      batch.delete(followRef);
      this.unfollow.unsubscribe();
      return batch.commit();
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
