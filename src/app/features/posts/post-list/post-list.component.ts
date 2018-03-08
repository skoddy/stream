import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { map } from 'rxjs/operators/map';
import { ToastService } from '@app/core/toast.service';
import { tap } from 'rxjs/operators';
import { post } from 'selenium-webdriver/http';
import { Subscription } from 'rxjs/Subscription';

export interface Post {
  uid: string;
  createdAt: string;
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
  refObs: Observable<Post>;
  feed$: Observable<Post[]>;
  stopFollowKeys: any;
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
    this.posts$ = this.db.colWithIds$(`users/${this.auth.uid}/posts`, ref => ref.orderBy('createdAt', 'desc'));
    this.posts$.subscribe(data => this.loading = false);
  }

  ngOnInit() {

  }

  private sortByCreatedAt(a, b) {
    if (a.createdAt < b.createdAt) { return 1; }
    if (a.createdAt > b.createdAt) { return -1; }
    return 0;
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


}
