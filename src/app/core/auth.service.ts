import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { FirebaseService } from './firebase.service';

import { Observable } from 'rxjs/Observable';
import { switchMap } from 'rxjs/operators';

import { ToastService } from './toast.service';
// presence
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database-deprecated';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/throttleTime';
import 'rxjs/add/observable/fromEvent';
interface User {
  uid: string;
  email?: string | null;
  photoURL?: string;
  displayName?: string;
}

@Injectable()
export class AuthService {
  mouseEvents: Subscription;
  timer: Subscription;
  userId: string; // current user uid
  public user: Observable<User | null>;
  private userDetails: User = null;
  constructor(private afAuth: AngularFireAuth,
    private db: FirebaseService,
    public router: Router,
    private toast: ToastService,
    private rtdb: AngularFireDatabase) {

    /*  The constructor will set the Observable.
        First it receives the current Firebase auth state.
        If present, it will hit up Firestore for the user’s saved custom data.
        If null, it will return an Observable.of(null). */
    this.user = this.afAuth.authState
      .switchMap((user) => {
        if (user) {
          // todo: upsert
          return this.db.doc$(`users/${user.uid}`);
        } else {
          return Observable.of(null);
        }
      });
    // Now we subscribe to the User Observable and save some details
    this.user.subscribe(
      (user) => {
        if (user) {
          this.userId = user.uid;
          this.updateOnConnect();
          this.updateOnDisconnect();
          this.updateOnIdle();
          this.userDetails = user;
          console.log(this.userDetails);
        } else {
          this.userDetails = null;
          this.router.navigate(['/login']);
        }
      }
    );
  }
  get authenticated(): boolean {
    // consider changing to 'return this.userDetails != null'
    if (this.userDetails == null) {
      return false;
    } else {
      return true;
    }
  }
  // Returns current user UID
  get currentUserId(): string {
    return this.authenticated ? this.userDetails.uid : '';
  }
  // Returns current user display name or Guest
  get currentUserDisplayName(): string {
    return this.userDetails.displayName || this.userDetails.email;
  }
  // Returns current user photo
  get currentUserPhoto(): string {
    return this.userDetails.photoURL || '';
  }

  getUsers() {
    return this.rtdb.list('/users');
  }
  /// Listen for mouse events to update status
  private updateOnIdle() {

    this.mouseEvents = Observable
      .fromEvent(document, 'mousemove')
      .throttleTime(2000)
      .do(() => {
        this.updateStatus('online');
        this.resetTimer();
      })
      .subscribe();
  }

  /// Reset the timer
  private resetTimer() {
    if (this.timer) { this.timer.unsubscribe(); }

    this.timer = Observable.timer(5000)
      .do(() => {
        this.updateStatus('away');
      })
      .subscribe();
  }

  /// Updates status when connection to Firebase ends
  private updateOnDisconnect() {
    firebase.database().ref().child(`users/${this.userId}`)
      .onDisconnect()
      .update({ status: 'offline' });
  }
  /// Helper to perform the update in Firebase
  private updateStatus(status: string) {
    if (!this.userId) { return; }

    this.rtdb.object(`users/` + this.userId).update({ status: status, name: this.currentUserDisplayName });
  }


  /// Updates status when connection to Firebase starts
  private updateOnConnect() {
    return this.rtdb.object('.info/connected')
      .do(connected => {
        const status = connected.$value ? 'online' : 'offline';
        this.updateStatus(status);
      })
      .subscribe();
  }

  ////// OAuth Methods /////
  googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    return this.oAuthLogin(provider);
  }

  githubLogin() {
    const provider = new firebase.auth.GithubAuthProvider();
    return this.oAuthLogin(provider);
  }

  facebookLogin() {
    const provider = new firebase.auth.FacebookAuthProvider();
    return this.oAuthLogin(provider);
  }

  twitterLogin() {
    const provider = new firebase.auth.TwitterAuthProvider();
    return this.oAuthLogin(provider);
  }

  private oAuthLogin(provider: firebase.auth.AuthProvider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((credential) => {
        this.toast.sendMsg('Willkommen!', 'OK');
        return this.upsertUserData(credential.user);
      })
      .catch((error) => this.handleError(error));
  }

  //// Anonymous Auth ////
  anonymousLogin() {
    return this.afAuth.auth.signInAnonymously()
      .then((user) => {
        // this.toast.update('Welcome to Firestarter!!!', 'success');
        return this.upsertUserData(user); // if using firestore
      })
      .catch((error) => {
        console.error(error.code);
        console.error(error.message);
        this.handleError(error);
      });
  }

  //// Email/Password Auth ////
  emailSignUp(email: string, password: string) {
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password)
      .then((user) => {
        // this.toast.update('Welcome to Firestarter!!!', 'success');
        return this.upsertUserData(user); // if using firestore
      })
      .catch((error) => this.handleError(error));
  }

  emailLogin(email: string, password: string) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then((user) => {
        // this.toast.update('Welcome to Firestarter!!!', 'success')
        return this.upsertUserData(user); // if using firestore
      })
      .catch((error) => this.handleError(error));
  }

  // Sends email allowing user to reset password
  resetPassword(email: string) {
    const fbAuth = firebase.auth();

    return fbAuth.sendPasswordResetEmail(email)
      // .then(() => this.toast.update('Password update email sent', 'info'))
      .catch((error) => this.handleError(error));
  }

  signOut() {
    this.updateStatus('offline');
    this.mouseEvents.unsubscribe();
    this.timer.unsubscribe();

    this.afAuth.auth.signOut();
  }

  // If error, console log and toast user
  private handleError(error: Error) {
    console.error(error);
    this.toast.sendMsg(error.message, 'OK');
  }

  // Sets user data to firestore after succesful login
  private upsertUserData(user: User) {

    const data: User = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || 'nameless user',
      photoURL: user.photoURL || 'https://goo.gl/Fz9nrQ',
    };

    this.db.upsert(`users/${user.uid}/subscriptions/${user.uid}`, {'uid': user.uid});
    return this.db.upsert(`users/${user.uid}`, data);
  }
}
