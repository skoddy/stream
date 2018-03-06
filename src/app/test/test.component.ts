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
  lastPost: string;
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
  followers: any;
  feed$: void;
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
    this.feed$ = this.getFeed();
   this.startHomeFeedLiveUpdater();
    // this.updateHomeFeeds();
  }

  subscribeToUserFeed(uid, callback, latestPostId) {
    return this.subscribeToFeed(`/users/${uid}/posts`, callback,
      latestPostId, true);
  }
  subscribeToHomeFeed(callback?, latestPostId?) {
    return this.subscribeToFeed(`/feed/${this.auth.uid}/posts`, callback, latestPostId,
      true);
  }
  getPosts() {
    return this.getPaginatedFeed('/posts/', this.POSTS_PAGE_SIZE);
  }
  getFeed() {
    return this.getPaginatedFeed(`/feed/${this.auth.uid}/posts`, this.POSTS_PAGE_SIZE);
  }

  toggleFollow(followedUserId, follow?) {
    const postRef = this.db.colWithIds$(`/people/${followedUserId}/posts`);
    postRef.subscribe(data => {
      const updateData = {};
      let lastPost = true;
      console.log('follow');
      // Add/remove followed user's posts to the home feed.
      data.forEach(post => {
        updateData[`/feed/${this.auth.uid}/posts/${post.id}`] = {
          follow: follow ? !!follow : null
        };
        lastPost = post.createdAt;
      });
      // Add/remove followed user to the 'following' list.
      updateData[`/people/${this.auth.uid}/following/${followedUserId}`] = {
        lastPost: follow ? lastPost : null
      };
      // Add/remove signed-in user to the list of followers.
      updateData[`/followers/${followedUserId}_${this.auth.uid}`] = {
        follow: follow ? !!follow : null
      };
      return this.db.batch(updateData, 'set');
    });
  }

  /*****
  /* Hält den Feed aktuell mit den letzten Posts der gefolgten User
   *****/

  private startHomeFeedLiveUpdater() {
    console.log('<Home Feed Live Updater>');
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
          this.followedUserPostsRef = this.followedUserPostsRef.orderByKey().startAt(_followingData.lastPost);
        }
        this.firebaseRefs.push(this.followedUserPostsRef);
        this.followedUserPostsRef.stateChanges(['added']).map(actionsb => {
          return actionsb.map(postData => {
            const _postData = postData.payload.doc.data() as Post;
            const _postDataId = postData.payload.doc.id;
            if (_postDataId !== _followingData) {
              const updates = {};
              updates[`/feed/${this.auth.uid}/posts/${_postDataId}`] = _postData;
              // updates[`/people/${this.auth.uid}/following/${_followedUid}`] = {uid: _followedUid};
              this.db.batch(updates, 'set');
            }
            return { _postDataId, ..._postData };
          });
        }).subscribe(console.log);
        return { _followedUid, ..._followingData };
      });
    }).subscribe(console.log);
    console.log('</Home Feed Live Updater>');
  }
homeFeedLiveUpdater() {
  const followingRef = this.db.col(`/people/${this.auth.uid}/following`);
  this.firebaseRefs.push(followingRef);
  this.followers = followingRef.stateChanges(['added']);
  this.followers.subscribe(followingData  => {
    const followedUid = followingData.id;
    console.log('followedUid: ' + followedUid);
    let followedUserPostsRef = this.db.colWithIds$(`/people/${followedUid}/posts`);
    if (followingData) {
      followedUserPostsRef = this.db.colWithIds$(`/people/${followedUid}/posts`, ref => ref.startAt(followingData.lastPost));
      console.log(followingData);
    }
  });
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
    console.log('<New Post>');
    const newPostKey = this.db.getNewKey('posts');
    const update = {};
    const data = {
      key: newPostKey,
      content: content,
      createdAt: this.db.timestamp,
      author: {
        uid: this.auth.uid,
        displayName: this.auth.displayName,
        photoURL: this.auth.photoURL
      }
    };
    update[`/posts/${newPostKey}`] = data;
    update[`/people/${this.auth.uid}/posts/${newPostKey}`] = data;
    update[`/feed/${this.auth.uid}/posts/${newPostKey}`] = data;
    console.log('</New Post>');
    return this.db.batch(update, 'set').then(() => newPostKey);
  }
}
