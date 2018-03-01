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
  arrayOfSubscribedUsers: Array<Observable<Post>>;
  content: string;
  category: string;

  constructor(private db: FirebaseService, private auth: AuthService) {
    this.arrayOfSubscribedUsers = new Array();
    // Query the collection in which the current user saved his subscriptions
    this.subscriptions$ = db.col$(`users/${this.auth.uid}/subscriptions`);
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
        map(items => items.sort(this.sortByCreatedAt))
      );
    });
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
    this.content = undefined;
    this.category = undefined;
  }

}
