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
  constructor(private db: FirebaseService, private toast: ToastService, private auth: AuthService) { }

  ngOnInit() {
    this.startHomeFeedLiveUpdater();
  }
  /*****
  /* Hält den Feed aktuell mit den letzten Posts der gefolgten User
   *****/

  private startHomeFeedLiveUpdater() {
    // Zuerst holen wir uns die Liste der gefolgten Benutzer
    this.followingRef = this.db.col(`/users/${this.auth.uid}/subscriptions`);
    this.firebaseRefs.push(this.followingRef);
    this.followingRef.stateChanges(['added']).map(actions => {
      return actions.map(followingData => {
        const _followingData = followingData.payload.doc.data() as Subs;
        const _followedUid = followingData.payload.doc.id;
        // valueChanges 'added' gibt uns immer den neusten Post
        console.log('Followed Id: ' + _followedUid);
        console.log('Data: ' + Object.keys(_followingData));
        this.followedUserPostsRef = this.db.col(`/users/${_followedUid}/posts`);
        if (_followingData instanceof String) {
          this.followedUserPostsRef = this.followedUserPostsRef.orderByKey().startAt(_followingData);
        }
        this.firebaseRefs.push(this.followedUserPostsRef);
        this.followedUserPostsRef.stateChanges(['added']).map(actionsb => {
          return actionsb.map(postData => {
            const _postData = postData.payload.doc.data() as Post;
            const _postDataId = postData.payload.doc.id;
            if (_postDataId !== _followingData) {
              const updates = {};
              updates[`/feed/${this.auth.uid}/posts/${_postDataId}`] = {value: true};
              updates[`/users/${this.auth.uid}/subscriptions/${_followedUid}/posts/${_postDataId}`] = {postId: _postDataId};
              this.db.batchUpdate(updates);
            }
            return { _postDataId, ..._postData };
          });
        }).subscribe(console.log);
        return { _followedUid, ..._followingData };
      });
    }).subscribe(console.log);
    // Wird die Subscription gelöscht, schalten wir den sb listener aus
    this.followingRef.stateChanges(['removed'], (followingData) => {
      const followedUserId = followingData.key;
      this.db.col$(`/people/${followedUserId}/posts`).off();
    }).subscribe(console.log);
  }

  private subscribeToFeed(uri: string, callback: any, latestEntry: string, fetchPostDetails: boolean) {
    let feedRef = this.db.col(uri);
    if (latestEntry) {
      feedRef = feedRef.startAt(latestEntry);
    }
    feedRef.valueChanges('added', feedData => {
      if (feedData.key !== latestEntry) {
        if (!fetchPostDetails) {
          callback(feedData.key, feedData.val());
        } else {
          this.db.col(`/post/${feedData.key}`).valueChanges().then(
            postData => callback(postData.key, postData.val())
          );
        }
      }
    });
    this.firebaseRefs.push(feedRef);
  }

  private getPaginatedFeed(uri: string, pageSize: number, earliestEntryId, fetchPostDetails: boolean) {
    console.log('Fetching entries from', uri, 'start at', earliestEntryId, 'page size', pageSize);
    let ref = this.db.ref(uri);
    if (earliestEntryId) {
      ref = ref.endAt(earliestEntryId);
    }
    // Test ob es eine nächste Seite gibt
    return ref.orderBy('id', 'asc').limit(pageSize + 1).stateChanges();
  }


  getItems(ids: string[]): Observable<Post> {
    return from(ids).pipe(
      concatMap(id => <Observable<Post>>this.db.doc$(`post/${id}`))
    );
  }
  getPosts(ids: string[]): Observable<Post> {
    return from(ids).pipe(
      concatMap(id => <Observable<Post>>this.db.doc$(`post/${id}`))
    );
  }
  getSubIds(): Observable<Subs> {
    return this.db.col$(`users/${this.auth.uid}/subscriptions`);
  }
}
