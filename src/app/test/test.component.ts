import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ToastService } from '@app/core/toast.service';
import { AuthService } from '@app/core/auth.service';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction } from 'angularfire2/firestore';
import { Subscription } from 'rxjs/Subscription';
import * as firebase from 'firebase/app';
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
  feed$: AngularFirestoreCollection<{}>;
  sub: any;
  unfollow: Subscription;
  follow: Subscription;
  private itemsCollection: AngularFirestoreCollection<Post>;
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

  private feedCol: AngularFirestoreCollection<Post>;
  feed: Observable<PostId[]>;
  feedSub: Subscription;
  content: string;
  constructor(
    private toast: ToastService,
    private auth: AuthService,
    private readonly afs: AngularFirestore) {
      this.feedCol = this.afs.collection<Post>(`/feed/${this.auth.uid}/posts`,
      ref => ref.orderBy('createdAt', 'desc'));

    this.feed = this.feedCol.valueChanges();

  }

  ngOnInit() {
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
          this.followedUserPostsCol = this.afs.collection<Post>(`/people/${followedUid}/posts`);
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
              if (postDate !== lastPostDate) {
                console.log('neue posts - starte update...');
                const db = firebase.firestore();
                const batch = db.batch();
                const feedsRef = db.doc(`/feed/${this.auth.uid}/posts/${postData.id}`);
                console.log(`/feed/${this.auth.uid}/posts/${postData.id}`);
                batch.set(feedsRef, postData);
                const followRef = db.doc(`/people/${this.auth.uid}/following/${followedUid}`);
                batch.set(followRef, { lastPost: postData.createdAt });
                batch.commit();
              } else {
                console.log('keine neuen posts...');
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
        console.log(unfollowingData);
      });
    });

    console.log(`onInit`);
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnDestroy() {
    this.followerSub.unsubscribe();
    this.unfollowerSub.unsubscribe();
    console.log(`onDestroy`);
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
    const postDocRef = this.afs.doc(`/people/${this.auth.uid}/posts/${newPostKey}`);
    const myPostsRef = db.doc(`/people/${this.auth.uid}/posts/${newPostKey}`);
    const allPostsRef = db.doc(`/posts/${newPostKey}`);
    const myFeedRef = db.doc(`/feed/${this.auth.uid}/posts/${newPostKey}`);
    batch.set(myPostsRef, data);
    batch.set(allPostsRef, data);
    batch.set(myFeedRef, data);
    return batch.commit();
  }
  followUser(followedUserId) {
    const db = firebase.firestore();
    const batch = db.batch();
    this.itemsCollection = this.afs.collection<Post>(`/people/${followedUserId}/posts`, ref => ref.orderBy('createdAt', 'desc'));
    this.items = this.itemsCollection.valueChanges();

    this.follow = this.items.subscribe(data => {
      let lastPostId = new Date();
      console.log('follow: ' + followedUserId);
      // Add followed user's posts to the home feed.
      data.forEach(post => {
        if (post) {
          const postsDoc = db.doc(`/feed/${this.auth.uid}/posts/${post.id}`);
          batch.set(postsDoc, post);
          lastPostId = post.createdAt;
          console.log('lastpostId: ' + lastPostId);
        }
      });

      // Add followed user to the 'following' list.
      const followingRef = db.doc(`/people/${this.auth.uid}/following/${followedUserId}`);
      batch.set(followingRef, { lastPost: lastPostId });
      // Add signed-in user to the list of followers.
      const followRef = db.doc(`/followers/${this.auth.uid}_${followedUserId}`);
      batch.set(followRef, { follow: true });
      this.follow.unsubscribe();
      return batch.commit();
    });
  }
// TODO: unfollow löscht posts nicht"!!!!!!!!!!!!!!
  unFollowUser(followedUserId) {
    const batch = firebase.firestore().batch();
    this.itemsCollection = this.afs.collection<Post>(`/people/${followedUserId}/posts`);
    this.items = this.itemsCollection.valueChanges();
    this.unfollow = this.items.subscribe(data => {
      const updateData = {};
      console.log('unfollow: ' + followedUserId);
      // Remove followed user's posts to the home feed.
      data.forEach(post => {
        const postsRef = firebase.firestore().doc(`/feed/${this.auth.uid}/posts/${post.id}`);
        batch.delete(postsRef);
        console.log(`/feed/${this.auth.uid}/posts/${post.id}`);
        console.log(postsRef);
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

}

