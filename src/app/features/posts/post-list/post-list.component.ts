import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { tap, map } from 'rxjs/operators';
import { mergeAll, take } from 'rxjs/operators';
import { interval } from 'rxjs/observable/interval';
import { mergeMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
export interface Posts {
  id: string;
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
export interface User {
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
  posts$: Observable<Posts[]>;
  observablesArray: Array<any>;
  content: string;
  category: string;
  subscriptions$: Observable<any>;
  subscribedTo: any;
  constructor(private db: FirebaseService, private auth: AuthService) {
    // Query multiple collections with realtime listener
    this.observablesArray = new Array();
    this.subscriptions$ = db.col$(`users/${this.auth.currentUserId}/subscriptions`);
  }

  ngOnInit() {
    // Combine
    this.subscriptions$.subscribe((data) => {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const element = data[key];
          this.observablesArray[key] = this.db.colWithIds$(`users/${element.uid}/posts`,
            ref => ref.orderBy('createdAt', 'desc'));
        }
      }
      this.posts$ = combineLatest<any[]>(...this.observablesArray).pipe(
        map(arr => arr.reduce((acc, cur) => acc.concat(cur))),
        // Sort
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
