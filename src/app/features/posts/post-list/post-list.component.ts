import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { tap, map } from 'rxjs/operators';
import { mergeAll, take } from 'rxjs/operators';
import { interval } from 'rxjs/observable/interval';
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
@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  posts$: Observable<Posts[]>;
  fooPosts$: Observable<Posts[]>;
  barPosts$: Observable<Posts[]>;
  content: string;
  category: string;
  constructor(private db: FirebaseService, private auth: AuthService) {
    // Query multiple collections with realtime listener
    this.fooPosts$[0] = this.db.colWithIds$(`users/njcHiz8vz4fI5qVtIRgKGdKqxWF2/posts`,
      ref => ref.orderBy('createdAt', 'desc'));
    this.fooPosts$[1] = this.db.colWithIds$(`users/pwckgADVLXXI84yL72ml4S7kQcV2/posts`,
      ref => ref.orderBy('createdAt', 'desc'));

    const h = interval(100).pipe(take(2), map(i => [this.fooPosts$][i]));

    h.pipe(mergeAll()).subscribe(val => console.log('merged'));
  }

  ngOnInit() {
    // Combine
    this.posts$ = combineLatest<any[]>(this.fooPosts$, this.barPosts$).pipe(
      map(arr => arr.reduce((acc, cur) => acc.concat(cur))),
      // Sort
      map(items => items.sort(this.sortByCreatedAt))
    );
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
