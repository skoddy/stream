import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { ToastService } from '@app/core/toast.service';
import { concatMap } from 'rxjs/operators';
import { from } from 'rxjs/observable/from';
import { Subscription } from 'rxjs/Subscription';
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
  stopFollowRef: any;
  followers: any;
  feed$: any;
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
    this.homeFeedLiveUpdater();
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
    // Make sure we listen on each followed people's posts.
    this.followingRef = this.db.col(`/people/${this.auth.uid}/following`);
    this.firebaseRefs.push(this.followingRef);

    this.followingRef.stateChanges(['added']).map(followingRef => {
      followingRef.map(following => {
        // Start listening the followed user's posts to populate the home feed.
        const followingData = following.payload.doc.data();
        const followedUid = following.payload.doc.id;
        console.log('followedUid: ' + followedUid);

        if (following) {
          console.log(followingData.lastPost);
          this.followedUserPostsRef = this.db.col(`/people/${followedUid}/posts`, ref =>
            ref.orderBy('createdAt', 'asc').startAt(followingData.lastPost));
          console.log(followingData);
        }
        this.firebaseRefs.push(this.followedUserPostsRef);


        this.followedUserPostsRef.stateChanges(['added']).map(followedUserPostsRef => {
          followedUserPostsRef.map(followedUserPosts => {
            const followedUserPostsData = followedUserPosts.payload.doc.data();
            const followedUserPostsUid = followedUserPosts.payload.doc.id;
            console.log('jo: ' + Object.keys(followedUserPostsData) + ' ------ ' + followedUserPostsUid);
            console.log('jo: ' + followedUserPostsData.createdAt + ' ------ ' + followingData.lastPost);
            if (followedUserPostsData.createdAt !== followingData.lastPost) {
              console.log('starting updates');
              const updates = {};
              updates[`/feed/${this.auth.uid}/posts/${followedUserPostsUid}`] = followedUserPostsData;
              updates[`/people/${this.auth.uid}/following/${followedUid}`] = {lastPost: followedUserPostsData.createdAt};
              this.db.batch(updates, 'set');
            }
            return { followedUserPostsUid, ...followedUserPostsData };
          });
        }).subscribe(console.log);
        this.followingRef.stateChanges(['removed']).map(_followingRef => {
          _followingRef.map(_following => {
            // Stop listening the followed user's posts to populate the home feed.
            const _followingData = _following.payload.doc.data();
            const _followingUid = _following.payload.doc.id;
            const followedUserId = followingData.key;
            this.stopFollowRef = this.db.col(`/people/${_followingUid}/posts`);
            // this.stopFollowRef.unsubscribe();
            return { _followingUid, ..._followingData };
          });
        }).subscribe(console.log);


        return { followedUid, ...followingData };
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
    console.log('<New Post>');
    const newPostKey = this.db.getNewKey('posts');
    const update = {};
    const data = {
      key: newPostKey,
      content: content,
      createdAt: new Date(),
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
