import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { map } from 'rxjs/operators/map';

export interface Post {
  uid: string;
  createdAt: string;
  displayName: string;
  photoURL: string;
  content: string;
  category: string;
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
  /* Query multiple collections with realtime listener */
  posts$: Observable<Post[]>;
  subscriptions$: Observable<Post>;
  observablesArray: Array<Observable<Post>>;
  content: string;
  category: string;

  constructor(private db: FirebaseService, private auth: AuthService) {
    this.observablesArray = new Array();
    // Query the collection in which the current user saved his subscriptions
    this.subscriptions$ = db.col$(`users/${this.auth.currentUserId}/subscriptions`);
  }

  ngOnInit() {
    this.subscriptions$.subscribe((data) => {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const element = data[key];
          // Query the documents of the subscribed user and save them in an array
          this.observablesArray[key] = this.db.colWithIds$(`users/${element.uid}/posts`,
          ref => ref.orderBy('createdAt', 'desc'));
        }
      }
      // Combine the arrays
      this.posts$ = combineLatest<any[]>(...this.observablesArray).pipe(
        map(arr => arr.reduce((acc, cur) => acc.concat(cur))),
        // Sort by date created
        map(items => items.sort(this.sortByCreatedAt))
      );
    });
  }

  private sortByCreatedAt(a, b) {
    if (a.createdAt < b.createdAt) { return 1; }
    if (a.createdAt > b.createdAt) { return -1; }
    return 0;
  }

  private createPost() {
    this.db.add<NewPost>(`users/${this.auth.currentUserId}/posts`, {
      uid: this.auth.currentUserId,
      displayName: this.auth.currentUserDisplayName,
      photoURL: this.auth.currentUserPhoto,
      content: this.content,
      category: this.category
    });
    this.content = undefined;
    this.category = undefined;
  }

}
