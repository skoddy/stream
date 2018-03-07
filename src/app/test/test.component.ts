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
    private readonly afs: AngularFirestore) {




  }

  ngOnInit() {
    this.followedUserPostsSub = new Array();
    this.followerCol = this.afs.collection<Follower>(`/people/${this.auth.uid}/following`);
    this.follower = this.followerCol.auditTrail(['added'])
      .map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Follower;
          const id = a.payload.doc.id;
          console.log('follower added');
          console.log(id);
          return { id, ...data };
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
              const lastPostDate = followingData.lastPost.getTime();
              console.log('prüfe ob neue posts...');
              if (postDate !== lastPostDate) {
                console.log('neue posts - starte update...');
                const db = firebase.firestore();
                const batch = db.batch();
                const feedsRef = db.doc(`/feed/${this.auth.uid}/posts/${postData.id}`);
                batch.set(feedsRef, { value: true });
                const followRef = db.doc(`/people/${this.auth.uid}/following/${followedUid}`);
                batch.set(followRef, { lastPost: postData.createdAt });
                // batch.commit();
              } else {
                console.log('keine neuen posts...');
              }
            }
          });
        });
      });
    });
    this.unfollowerCol = this.afs.collection<Follower>(`/people/${this.auth.uid}/following`);
    this.unfollower = this.followerCol.stateChanges(['removed'])
      .map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Follower;
          const id = a.payload.doc.id;
          console.log('follower removed');
          console.log(id);
          return { id, ...data };
        });
      });
    this.unfollowerSub = this.unfollower.subscribe(_unfollowingData => {
      _unfollowingData.forEach(unfollowingData => {
        console.log(unfollowingData.id);
      });
    });
    this.unfollowerSub.unsubscribe();
    console.log(`onInit`);
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnDestroy() {
    this.followerSub.unsubscribe();
    console.log(`onDestroy`);
  }
  newPost(content?: string) {
    console.log('<New Post>');
    const ref = firebase.firestore().collection('posts').doc();
    const newPostKey = ref.id;
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
    // return this.db.batch(update, 'set').then(() => newPostKey);
  }

}
