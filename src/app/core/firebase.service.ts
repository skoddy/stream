import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/switchMap';

import * as firebase from 'firebase/app';

type CollectionPredicate<T> = string | AngularFirestoreCollection<T>;
type DocPredicate<T> = string | AngularFirestoreDocument<T>;

@Injectable()
export class FirebaseService {

  constructor(private afs: AngularFirestore) { }
  get timestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }
  getNewKey(ref: any) {
    const _ref = firebase.firestore().collection(ref).doc();
    const newKey = _ref.id;
    console.log('new key: ' + newKey);
    return newKey;
  }

  private batch(updates: any, type: string) {
    const batch = firebase.firestore().batch();
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        const path = key;
        const data = updates[key];
        const ref = firebase.firestore().doc(path);
        switch (type) {
          case 'set':
            batch.set(ref, {
              ...data
            });
            console.log('batch set: ' + path);
            break;
          case 'delete':
            batch.delete(ref);
            console.log('batch delete: ' + path);
            break;
        }
      }
    }

    return batch.commit();
  }
  // this.db.upsert('notes/xyz', { content: 'hello world'})
  upsert<T>(ref: DocPredicate<T>, data: any) {
    const doc = this.doc(ref).snapshotChanges().take(1).toPromise();

    return doc.then(snap => {
      return snap.payload.exists ? this.update(ref, data) : this.set(ref, data);
    });
  }
  // db.update('items/ID', data) }) // adds updatedAt field
  // db.set('items/ID', data) })    // adds createdAt field
  // db.add('items', data) })       // adds createdAt field
  update<T>(ref: DocPredicate<T>, data: any) {
    return this.doc(ref).update({
      ...data,
      updatedAt: this.timestamp
    });
  }
  delete<T>(ref: DocPredicate<T>) {
    return this.doc(ref).delete();
  }
  set<T>(ref: DocPredicate<T>, data: any) {
    const timestamp = this.timestamp;
    return this.doc(ref).set({
      ...data,
      updatedAt: timestamp,
      createdAt: timestamp
    });
  }

  add<T>(ref: CollectionPredicate<T>, data) {
    const timestamp = this.timestamp;
    return this.col(ref).add({
      ...data,
      updatedAt: timestamp,
      createdAt: timestamp
    });
  }
  // return a reference
  col<T>(ref: CollectionPredicate<T>, queryFn?): AngularFirestoreCollection<T> {
    return typeof ref === 'string' ? this.afs.collection<T>(ref, queryFn) : ref;
  }

  doc<T>(ref: DocPredicate<T>): AngularFirestoreDocument<T> {
    return typeof ref === 'string' ? this.afs.doc<T>(ref) : ref;
  }

  // return an observable
  // this.db.doc$('notes/ID')
  // this.db.col$('notes', ref => ref.where('user', '==', 'Micha'))
  doc$<T>(ref: DocPredicate<T>): Observable<T> {
    return this.doc(ref).snapshotChanges().map(doc => {
      return doc.payload.data() as T;
    });
  }

  col$<T>(ref: CollectionPredicate<T>, queryFn?): Observable<T[]> {
    return this.col(ref, queryFn).snapshotChanges().map(docs => {
      return docs.map(a => a.payload.doc.data()) as T[];
    });
  }
  // db.colWithIds$('notes')
  colWithIds$<T>(ref: CollectionPredicate<T>, queryFn?): Observable<any[]> {
    return this.col(ref, queryFn).snapshotChanges().map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data };
      });
    });
  }
  colWithIdsAdded$<T>(ref: CollectionPredicate<T>, queryFn?): Observable<any[]> {
    return this.col(ref, queryFn).snapshotChanges(['added']).map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data };
      });
    });
  }
  // this.db.inspectDoc('notes/xyz')
  // this.db.inspectCol('notes')
  inspectDoc(ref: DocPredicate<any>): void {
    const tick = new Date().getTime();
    this.doc(ref).snapshotChanges()
      .take(1)
      .do(d => {
        const tock = new Date().getTime() - tick;
        console.log(`Loaded Document in ${tock}ms`, d);
      })
      .subscribe();
  }

  inspectCol(ref: CollectionPredicate<any>): void {
    const tick = new Date().getTime();
    this.col(ref).snapshotChanges()
      .take(1)
      .do(c => {
        const tock = new Date().getTime() - tick;
        console.log(`Loaded Collection in ${tock}ms`, c);
      })
      .subscribe();
  }
}
