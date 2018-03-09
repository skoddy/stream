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
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

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
export interface QueryConfig {
  path: string;
  field: string;
  limit: number;
  reverse: boolean;
  prepend: boolean;
  direction: string;
}
@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  posts$: void;
  feed$: Observable<Post[]>;
  content: string;
  category: string;
  private query: QueryConfig;
  // Source data
  private _done = new BehaviorSubject(false);
  private _loading = new BehaviorSubject(false);
  private _data = new BehaviorSubject([]);
 // Observable data
 data: Observable<any>;
 done: Observable<boolean> = this._done.asObservable();
 loading: Observable<boolean> = this._loading.asObservable();
  constructor(
    private db: FirebaseService,
    private auth: AuthService,
    private toast: ToastService,
    private afs: AngularFirestore) { }

  ngOnInit() {
    this.init(`users/${this.auth.uid}/posts`, 'createdAt');

  }
  init(path: string, field: string, opts?: any) {
    this.query = {
      path,
      field,
      limit: 1,
      reverse: true,
      prepend: false,
      ...opts
    };

    const first = this.afs.collection(this.query.path, ref => {
      return ref
      .orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc')
      .limit(this.query.limit);
    });
console.log(first);
    this.mapAndUpdate(first);

    // Create the observable array for consumption in components
    this.data = this._data.asObservable()
      .scan((acc, val) => {
        return this.query.prepend ? val.concat(acc) : acc.concat(val);
      });

  }
  // Retrieves additional data from firestore
  more() {
    const cursor = this.getCursor();
    const more = this.afs.collection(this.query.path, ref => {
      return ref
        .orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc')
        .limit(this.query.limit)
        .startAfter(cursor);
    });
    this.mapAndUpdate(more);
  }

  // Determines the doc snapshot to paginate query
  private getCursor() {
    const current = this._data.value;
    if (current.length) {
      return this.query.prepend ? current[0].doc : current[current.length - 1].doc;
    }
    return null;
  }

  // Maps the snapshot to usable format the updates source
  private mapAndUpdate(col: AngularFirestoreCollection<any>) {
    if (this._done.value || this._loading.value) { return; }
    // loading
    this._loading.next(true);
    // Map snapshot with doc ref (needed for cursor)
    return col.snapshotChanges().pipe(
      tap(arr => {
        let values = arr.map(snap => {
          const data = snap.payload.doc.data();
          const doc = snap.payload.doc;
          const id = snap.payload.doc.id;
          return { id, ...data, doc };
        });
        // If prepending, reverse the batch order
        values = this.query.prepend ? values.reverse() : values;

        // update source with new values, done loading
        this._data.next(values);
        this._loading.next(false);
        // update source with new values, done loading
        // no more values, mark done
        if (!values.length) {
          this._done.next(true);
        } else {
          console.warn('Need some data to use to disable the buttons when end is hit');
        }
        this._loading.next(false);
      }),
    ).take(1).subscribe();
  }
  private getPosts(lastEntry?: string, limitTo = 5) {
    if (lastEntry) {
      this.posts$ = this.db.colWithIds$(`users/${this.auth.uid}/posts`,
        ref => ref.orderBy('createdAt', 'desc').startAt(lastEntry).limit(limitTo));
    } else {
      this.posts$ = this.db.colWithIds$(`users/${this.auth.uid}/posts`,
        ref => ref.orderBy('createdAt', 'desc').limit(limitTo));
    }

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
