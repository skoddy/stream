import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ToastService } from '@app/core/toast.service';
import { AuthService } from '@app/core/auth.service';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction } from 'angularfire2/firestore';
import { Subscription } from 'rxjs/Subscription';
import * as firebase from 'firebase/app';
import { FirebaseService } from '@app/core/firebase.service';
import { concatMap, switchMap } from 'rxjs/operators';
import { from } from 'rxjs/observable/from';
export interface Follower { id: string; lastPost: any; }
export interface FollowerId extends Follower { id: string; }
export interface Post {
  id: string;
  uid: string;
  createdAt: any;
  content: string;
  category: string;
  author: {
    displayName: string;
    photoURL: string;
  };
}
export interface PostId extends Post { id: string; }

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {


  itemsCollection: Observable<any[]>;
  noteDoc: Observable<{}>;
  feeds: Subscription;
  feedCol: Observable<any[]>;
  sub: any;
  unfollow: Subscription;
  follow: Subscription;
  items: Observable<Post[]>;
  toggleFollowRef: any;

  private followerCol: AngularFirestoreCollection<Follower>;
  follower: Observable<FollowerId[]>;
  followerSub: Subscription;

  private followedUserPostsCol: AngularFirestoreCollection<Post>;
  followedUserPosts: Observable<PostId[]>;
  followedUserPostsSub: Subscription[];

  private unfollowerCol: AngularFirestoreCollection<Follower>;
  unfollower: Observable<FollowerId[]>;
  unfollowerSub: Subscription;


  content: string;
  constructor(
    private toast: ToastService,
    private auth: AuthService,
    private readonly afs: AngularFirestore,
    private db: FirebaseService) {
    this.feedCol = this.db.colWithIds$(`feed/${this.auth.uid}/posts`,
      ref => ref.orderBy('createdAt', 'desc'));
  }

  ngOnInit() {
    this.feedLiveUpdater();
    console.log(`onInit`);
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnDestroy() {
    this.followerSub.unsubscribe();
    this.unfollowerSub.unsubscribe();
    console.log(`onDestroy`);
  }
  getItems(ids: number[]): Observable<Post> {
    return from(ids).pipe(
      concatMap(id => <Observable<Post>>this.db.doc$(`post/${id}`))
    );
  }
  feedLiveUpdater() {
    this.followedUserPostsSub = new Array();
    this.followerCol = this.afs.collection<Follower>(`/people/${this.auth.uid}/following`);
    this.follower = this.followerCol.auditTrail(['added'])
      .map(actions => {
        return actions.map(a => {
          console.log(a.type);
          const action = a.type;
          const data = a.payload.doc.data() as Follower;
          const id = a.payload.doc.id;
          console.log('follower added');
          console.log(id);
          return { id, ...data, action };
        });
      });

    this.followerSub = this.follower.subscribe(_followingData => {
      _followingData.forEach(followingData => {
        console.log(followingData);
        const followedUid = followingData.id;
        if (followingData) {
          this.followedUserPostsCol = this.afs.collection<Post>(`/people/${followedUid}/posts`,
            ref => ref.orderBy('createdAt', 'asc').startAfter(followingData.lastPost));
        }

        this.followedUserPosts = this.followedUserPostsCol.auditTrail(['added'])
          .map(actions => {
            return actions.map(a => {
              const data = a.payload.doc.data() as Post;
              const id = a.payload.doc.id;
              console.log('post added');
              console.log(id);
              return { id, ...data };
            });
          });

        this.followedUserPostsSub[followedUid] = this.followedUserPosts.subscribe(_postData => {
          _postData.forEach(postData => {
            if (postData) {
              const postDate = postData.createdAt.getTime();
              const lastPostDate = followingData.lastPost ? followingData.lastPost.getTime() : null;
              console.log('prüfe ob neue posts...');
              console.log(`created: ${postData.createdAt} lastpost: ${followingData.lastPost}`);
              if (postDate > lastPostDate && postDate !== lastPostDate) {
                console.log('neuer post - starte update...');
                const db = firebase.firestore();
                const batch = db.batch();
                const postDocRef = this.afs.doc(`/posts/${postData.id}`);
                const feedsRef = db.doc(`/feed/${this.auth.uid}/posts/${postData.id}`);
                console.log(`/feed/${this.auth.uid}/posts/${postData.id}`);
                batch.set(feedsRef, { pathRef: postDocRef.ref, createdAt: postData.createdAt });
                const followRef = db.doc(`/people/${this.auth.uid}/following/${followedUid}`);
                batch.set(followRef, { lastPost: postData.createdAt });
                batch.commit();
              } else {
                console.log('post schon vorhanden...');
              }
            }
          });
        });
      });
    });
    this.unfollowerCol = this.afs.collection<Follower>(`/people/${this.auth.uid}/following`);
    this.unfollower = this.unfollowerCol.auditTrail(['removed'])
      .map(actions => {
        return actions.map(a => {
          const action = a.type;
          const data = a.payload.doc.data() as Follower;
          const id = a.payload.doc.id;
          console.log('follower removed');
          console.log(id);
          return { id, ...data, action };
        });
      });
    this.unfollowerSub = this.unfollower.subscribe(_unfollowingData => {
      _unfollowingData.forEach(unfollowingData => {
        console.log('unfollowingData: ');
        console.log(unfollowingData.id);
        this.followedUserPostsSub[unfollowingData.id].unsubscribe();
      });
    });
  }
  getPostData(postId) {
    return this.afs.doc(`/posts/${postId}`).valueChanges();
  }
  newPost(content?: string) {
    console.log('<New Post>');
    const ref = firebase.firestore().collection('posts').doc();
    const newPostKey = ref.id;
    const update = {};
    const db = firebase.firestore();
    const batch = db.batch();
    const createdAt = new Date();
    const data = {
      key: newPostKey,
      content: content,
      createdAt: createdAt,
      author: {
        uid: this.auth.uid,
        displayName: this.auth.displayName,
        photoURL: this.auth.photoURL
      }
    };
    const postDocRef = this.afs.doc(`/posts/${newPostKey}`);
    const allPostsRef = db.doc(`/posts/${newPostKey}`);
    const myPostsRef = db.doc(`/people/${this.auth.uid}/posts/${newPostKey}`);
    const myFeedRef = db.doc(`/feed/${this.auth.uid}/posts/${newPostKey}`);
    batch.set(allPostsRef, data);
    batch.set(myPostsRef, { pathRef: postDocRef.ref, createdAt: createdAt });
    batch.set(myFeedRef, { pathRef: postDocRef.ref, createdAt: createdAt });
    return batch.commit();
  }
  followUser(followedUserId) {
    const db = firebase.firestore();
    const batch = db.batch();
    this.itemsCollection = this.db.colWithIds$(`/people/${followedUserId}/posts`, ref => ref.orderBy('createdAt', 'asc'));

    this.follow = this.itemsCollection.subscribe(data => {
      let lastPostId = new Date();
      console.log('follow: ' + followedUserId);
      console.log(data);
      // Add followed user's posts to the home feed.
      data.forEach(post => {
        console.log(post);
        if (post) {
          const postDocRef = this.afs.doc(`/posts/${post.id}`);
          const postsDoc = db.doc(`/feed/${this.auth.uid}/posts/${post.id}`);
          batch.set(postsDoc, { pathRef: postDocRef.ref, createdAt: post.createdAt });
          lastPostId = post.createdAt;
          console.log('lastpostId: ' + lastPostId);
        }
      });

      // Add followed user to the 'following' list.
      const startedToFollow = new Date();
      const followingRef = db.doc(`/people/${this.auth.uid}/following/${followedUserId}`);
      batch.set(followingRef, { lastPost: lastPostId, createdAt: startedToFollow});
      // Add signed-in user to the list of followers.
      const followRef = db.doc(`/followers/${this.auth.uid}_${followedUserId}`);
      batch.set(followRef, { follow: true });

      const lastFollower = db.doc(`/people/${followedUserId}`);
      batch.update(lastFollower, { lastFollower: startedToFollow });
      batch.commit();
      this.follow.unsubscribe();
    });
  }
  // TODO: unfollow löscht posts nicht"!!!!!!!!!!!!!!
  unFollowUser(followedUserId) {
    const db = firebase.firestore();
    const batch = db.batch();
    this.itemsCollection = this.db.colWithIds$(`/people/${followedUserId}/posts`);
    this.unfollow = this.itemsCollection.subscribe(data => {
      console.log('unfollow: ' + followedUserId);
      console.log(data);
      // Remove followed user's posts to the home feed.
      data.forEach(post => {
        console.log(post);
        const postsRef = db.doc(`/feed/${this.auth.uid}/posts/${post.id}`);
        batch.delete(postsRef);
        console.log(`/feed/${this.auth.uid}/posts/${post.id}`);
        console.log(postsRef);
      });
      // Remove followed user to the 'following' list.
      const followingRef = db.doc(`/people/${this.auth.uid}/following/${followedUserId}`);
      batch.delete(followingRef);
      // Remove signed-in user to the list of followers.
      const followRef = db.doc(`/followers/${this.auth.uid}_${followedUserId}`);
      batch.delete(followRef);
      batch.commit();
      this.unfollow.unsubscribe();
    });

  }

}

