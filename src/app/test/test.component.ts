import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { ToastService } from '@app/core/toast.service';
import { concatMap } from 'rxjs/operators';
import { from } from 'rxjs/observable/from';
import { User } from '../user-model';
import { AuthService } from '@app/core/auth.service';
export interface Subs {
  uid: string;
}
export interface Post {
  uid: string;
  createdAt: string;
  content: string;
}
@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {
  firebaseRefs = [];
  followingRef: any;
  followedUserPostsRef: any;
  followedUid: any;
  constructor(private db: FirebaseService, private toast: ToastService, private auth: AuthService) { }

  ngOnInit() {
    this.followingRef = this.db.col(`/users/${this.auth.uid}/subscriptions`);
    this.firebaseRefs.push(this.followingRef);
    this.followingRef.valueChanges(['added'], (followingData) => {
      this.followedUid = followingData.key;
      console.log(followingData.key);
      this.followedUserPostsRef = this.db.col(`/users/${this.followedUid}/posts`);
      if (followingData.val() instanceof String) {
      this.followedUserPostsRef = this.followedUserPostsRef.orderByKey().startAt(followingData.val());
      }
      this.firebaseRefs.push(this.followedUserPostsRef);
      this.followedUserPostsRef.subscribe((postData) => {
        if (postData.key !== followingData.val()) {
          const updates = {};
          updates[`/feed/${this.auth.uid}/${postData.key}`] = true;
          updates[`/users/${this.auth.uid}/subscriptions/${this.followedUid}`] = postData.key;
          this.db.ref().update(updates);
        }
      });
    });
    this.followingRef.valueChanges(['removed'], (followingData) => {
      const followedUserId = followingData.key;
      this.db.col$(`/people/${followedUserId}/posts`).off();
    });
  }
  getItems(ids: string[]): Observable<Post> {
    return from(ids).pipe(
       concatMap(id => <Observable<Post>> this.db.doc$(`post/${id}`))
    );
  }
  getPosts(ids: string[]): Observable<Post> {
    return from(ids).pipe(
       concatMap(id => <Observable<Post>> this.db.doc$(`post/${id}`))
    );
  }
  getSubIds(): Observable<Subs> {
    return this.db.col$(`users/${this.auth.uid}/subscriptions`);
  }
}
