import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core';
import { AuthService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { tap, map } from 'rxjs/operators';
export interface Posts {
  id?: string;
  content?: string;
  photoURL: string;
  uid: string;
  displayName: string;
  updatedAt: string;
}
@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  posts$: Observable<Posts[]>;
  content: string;
  category: string;
  showSpinner = true;
  constructor(private db: FirebaseService, private auth: AuthService) {
    const fooPosts = this.db.colWithIds$(`users/njcHiz8vz4fI5qVtIRgKGdKqxWF2/posts`, ref => ref.orderBy('createdAt', 'desc'));
    const barPosts = this.db.colWithIds$(`users/pwckgADVLXXI84yL72ml4S7kQcV2/posts`, ref => ref.orderBy('createdAt', 'desc'));

    this.posts$ = combineLatest<any[]>(fooPosts, barPosts).pipe(
      map(arr => arr.reduce((acc, cur) => acc.concat(cur))),
      map(items => items.sort(this.sortByCreatedAt))
    );

  }
  sortByCreatedAt(a, b) {
    if (a.createdAt < b.createdAt) { return 1; }
    if (a.createdAt > b.createdAt) { return -1; }
    return 0;
  }
  ngOnInit() {
    // this.posts$ = this.db.colWithIds$(`users/${this.auth.currentUserId}/posts`, ref => ref.orderBy('createdAt', 'desc'));
  }
  createPost() {
    this.db.add(`users/${this.auth.currentUserId}/posts`, {
      content: this.content,
      category: this.category,
      displayName: this.auth.currentUserDisplayName,
      uid: this.auth.currentUserId,
      photoURL: this.auth.currentUserPhoto
    });

    this.content = undefined;
    this.category = undefined;
  }

}
