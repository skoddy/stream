import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { map } from 'rxjs/operators/map';
import { ToastService } from '@app/core/toast.service';
import { tap } from 'rxjs/operators';

export interface Post {
  uid: string;
  createdAt: string;
  displayName: string;
  photoURL: string;
  content: string;
  category: string;
  author: {
    displayName: string;
    photoURL: string;
  };
}
export interface NewPost {
  uid: string;
  displayName: string;
  photoURL: string;
  content: string;
  category: string;
}

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  feed$: Observable<Post[]>;
  stopFollowRef: any;
  followingRef: any;
  firebaseRefs = [];
  followedUserPostsRef: any;
  /* Query multiple collections with realtime listener */
  posts$: Observable<Post[]>;
  subscriptions$: Observable<Post>;
  arrayOfSubscribedUsers: Array<Observable<Post>>;
  content: string;
  category: string;
  loading = true;
  constructor(
    private db: FirebaseService,
    private auth: AuthService,
    private toast: ToastService) {
    this.arrayOfSubscribedUsers = new Array();
    // Query the collection in which the current user saved his subscriptions
/*     this.subscriptions$ = db.col$(`users/${this.auth.uid}/subscriptions`);
    this.subscriptions$.subscribe((data) => {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const element = data[key];
          // Query the documents of the subscribed user and save them in an array
          this.arrayOfSubscribedUsers[key] = this.db.colWithIds$(`users/${element.uid}/posts`);
        }
      }
      // Combine the arrays with combineLatest
      // As soon as all streams have emitted at least one value
      // each new emission produces a combined value through the result stream
      this.posts$ = combineLatest<any[]>(...this.arrayOfSubscribedUsers).pipe(
        // reduce() the values from the source observable
        //
        // concat() (verketten) streams by subscribing
        // and emitting values from each input sequentially
        // having ONE subscription at a time. i use concat because the
        // order of emission is important
        map(arr => arr.reduce((acc, cur) => acc.concat(cur))),
        // Sort by date created
        map(items => items.sort(this.sortByCreatedAt)),
        tap(val => this.loading = false)
      );
    }); */
  }

  ngOnInit() {
    this.posts$ = this.getFeed();
    this.posts$.subscribe(data => this.loading = false);
    this.homeFeedLiveUpdater();
  }
  getFeed() {
    return this.getPaginatedFeed(`/feed/${this.auth.uid}/posts`);
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

        if (following) {
          this.followedUserPostsRef = this.db.col(`/people/${followedUid}/posts`, ref =>
            ref.orderBy('createdAt', 'asc').startAt(followingData.lastPost));
        }
        this.firebaseRefs.push(this.followedUserPostsRef);

        this.followedUserPostsRef.stateChanges(['added']).map(followedUserPostsRef => {
          followedUserPostsRef.map(followedUserPosts => {
            const followedUserPostsData = followedUserPosts.payload.doc.data();
            const followedUserPostsUid = followedUserPosts.payload.doc.id;

            if (followedUserPostsData.createdAt !== followingData.lastPost) {
              console.log('starting updates');
              const updates = {};
              updates[`/feed/${this.auth.uid}/posts/${followedUserPostsUid}`] = followedUserPostsData;
              updates[`/people/${this.auth.uid}/following/${followedUid}`] = { lastPost: followedUserPostsData.createdAt };
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
  private sortByCreatedAt(a, b) {
    if (a.createdAt < b.createdAt) { return 1; }
    if (a.createdAt > b.createdAt) { return -1; }
    return 0;
  }
  newPost(content?: string) {
    console.log('<New Post>');
    const newPostKey = this.db.getNewKey('posts');
    const update = {};
    const data = {
      key: newPostKey,
      content: this.content,
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
    this.toast.sendOkMsg('POST GESPEICHERT');
    this.content = undefined;
    this.category = undefined;
    return this.db.batch(update, 'set').then(() => newPostKey);
  }
  public createPost() {
    this.db.add<NewPost>(`users/${this.auth.uid}/posts`, {
      uid: this.auth.uid,
      displayName: this.auth.displayName,
      photoURL: this.auth.photoURL,
      content: this.content,
      category: this.category
    });
    this.toast.sendOkMsg('POST GESPEICHERT');
    this.content = undefined;
    this.category = undefined;
  }
  private getPaginatedFeed(uri: string, pageSize?: number, earliestEntryId?, fetchPostDetails?: boolean) {
    console.log('Fetching entries from', uri, 'start at', earliestEntryId, 'page size', pageSize);
    return this.db.col$(uri, ref => ref.orderBy('createdAt', 'desc'));
  }
}
