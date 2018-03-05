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
  posts$: any;
  firebaseRefs = [];
  followingRef: any;
  followedUserPostsRef: any;
  content: string;
  constructor(private db: FirebaseService, private toast: ToastService, private auth: AuthService) { }
  get POSTS_PAGE_SIZE() {
    return 5;
  }
  ngOnInit() {
    this.posts$ = this.getPosts();
    this.startHomeFeedLiveUpdater();
    this.updateHomeFeeds();
  }
  subscribeToUserFeed(uid, callback, latestPostId) {
    return this.subscribeToFeed(`/users/${uid}/posts`, callback,
      latestPostId, true);
  }
  subscribeToHomeFeed(callback, latestPostId) {
    return this.subscribeToFeed(`/feed/${this.auth.uid}`, callback, latestPostId,
      true);
  }
  getPosts() {
    return this.getPaginatedFeed('/posts/', this.POSTS_PAGE_SIZE);
  }

  toggleFollowUser(followedUserId, follow?) {
    // Add or remove posts to the user's home feed.
    console.log('toggle: ' + followedUserId);
    return this.db.col(`/people/${followedUserId}/posts`).auditTrail()
      .map(actions => {
        return actions.map(posts => {
          const data = posts.payload.doc.data() as Post[];
          const id = posts.payload.doc.id;
          const updateData = {};
          const deleteData = {};
          let lastPostId = true;
          console.log('toggle data: ' + data);
          // Add/remove followed user's posts to the home feed.
          if (follow) {
            console.log('followed update data: ' + id);
            updateData[`/feed/${this.auth.uid}/posts/${id}`] = {
              follow: follow ? !!follow : null
            };
          } else {
            console.log('unfollowed delete data: ' + id);
            deleteData[`/feed/${this.auth.uid}/posts/${id}`] = true;
          }

          lastPostId = id;


          // Add/remove followed user to the 'following' list.
          updateData[`/people/${this.auth.uid}/following/${followedUserId}`] = {
            follow: follow ? lastPostId : null
          }; // TODO nur einmal follow/unfollow

          // Add/remove signed-in user to the list of followers.
          // updateData[`/followers/${followedUserId}/${this.auth.uid}`] =
          //     follow ? !!follow : null;
          this.db.batch(deleteData, 'delete');
          this.db.batch(updateData, 'set');
          return { id, ...data };
        });
      }).subscribe(console.log);
  }
  updateHomeFeeds() {
    const followingRef = this.db.col(`/people/${this.auth.uid}/following`);
    followingRef.stateChanges().map(actions => {
      actions.map(followingData => {
        const _followingData = followingData.payload.doc.data();
        const _followingUid = followingData.payload.doc.id;
        if (!_followingUid) {
          return;
        }
        console.log('following keys: ' + Object.keys(_followingData));
        const updateOperations = Object.keys(_followingData).map(followedUid => {
          const followedUserPostRef = this.db.col(`people/${followedUid}/posts`);
          const lastSyncedPostId = _followingData[followedUid];
          console.log('lastSyncedPostId: ' + _followingData[followedUid]);
        });
        return { _followingUid, ..._followingData };
      });
    }).subscribe(console.log);
  }
  /*****
  /* Hält den Feed aktuell mit den letzten Posts der gefolgten User
   *****/

  private startHomeFeedLiveUpdater() {
    // Zuerst holen wir uns die Liste der gefolgten Benutzer
    this.followingRef = this.db.col(`/people/${this.auth.uid}/following`);
    this.firebaseRefs.push(this.followingRef);
    this.followingRef.stateChanges(['added']).map(actions => {
      return actions.map(followingData => {
        const _followingData = followingData.payload.doc.data() as Subs;
        const _followedUid = followingData.payload.doc.id;
        // valueChanges 'added' gibt uns immer den neusten Post
        console.log('Followed Id: ' + _followedUid);
        console.log('Data: ' + Object.keys(_followingData));
        this.followedUserPostsRef = this.db.col(`/people/${_followedUid}/posts`);
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
              updates[`/feed/${this.auth.uid}/posts/${_postDataId}`] = { value: true };
              updates[`/people/${this.auth.uid}/following/${_followedUid}/posts/${_postDataId}`] = { postId: _postDataId };
              this.db.batch(updates, 'set');
            }
            return { _postDataId, ..._postData };
          });
        }).subscribe(console.log);
        return { _followedUid, ..._followingData };
      });
    }).subscribe(console.log);
    // Wird die Subscription gelöscht, schalten wir den sb listener aus
    this.followingRef.stateChanges(['removed']).map(action => {
      return action.map(followingData => {
        const followedUserId = followingData.payload.doc.id;
        this.db.col$(`/people/${followedUserId}/posts`).unsubscribe();
      });
    }).subscribe(console.log);
  }

  private subscribeToFeed(uri: string, callback: any, latestEntry: string, fetchPostDetails: boolean) {
    let feedRef = this.db.col(uri);
    if (latestEntry) {
      feedRef = feedRef.startAt(latestEntry);
    }
    feedRef.valueChanges('added').map(actions => actions.map(feedData => {
      const _feedData = feedData.payload.doc.data() as Post;
      const _feedDataId = feedData.payload.doc.id;
      if (_feedDataId !== latestEntry) {
        if (!fetchPostDetails) {
          callback(_feedDataId, _feedData);
        } else {
          this.db.col(`/post/${feedData.key}`).valueChanges().then(
            postData => callback(postData.key, postData.val())
          );
        }
      }
    }));
    this.firebaseRefs.push(feedRef);
  }

  private getPaginatedFeed(uri: string, pageSize: number, earliestEntryId?, fetchPostDetails?: boolean) {
    console.log('Fetching entries from', uri, 'start at', earliestEntryId, 'page size', pageSize);
    return this.db.col$(uri, ref => ref.orderBy('createdAt', 'desc'));
  }

  newPost(content?: string) {
    const newPostKey = this.db.getNewKey('posts');
    const update = {};
    update[`/posts/${newPostKey}`] = {
      content: content,
      createdAt: this.db.timestamp,
      author: {
        uid: this.auth.uid,
        displayName: this.auth.displayName,
        photoURL: this.auth.photoURL
      }
    };
    update[`/people/${this.auth.uid}/posts/${newPostKey}`] = { value: true };
    update[`/feed/${this.auth.uid}/posts/${newPostKey}`] = { value: true };
    return this.db.batch(update, 'set').then(() => newPostKey);
  }
}
