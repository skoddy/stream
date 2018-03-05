import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { FirebaseService } from './firebase.service';

import { Observable } from 'rxjs/Observable';
import { switchMap } from 'rxjs/operators';

import { ToastService } from './toast.service';

interface User {
  uid: string;
  email?: string | null;
  photoURL?: string;
  displayName?: string;
}

@Injectable()
export class AuthService {

  userId: string; // current user uid
  public user: Observable<User | null>;
  private userDetails: User = null;
  constructor(private afAuth: AngularFireAuth,
    private db: FirebaseService,
    public router: Router,
    private toast: ToastService) {

    /*  The constructor will set the Observable.
        First it receives the current Firebase auth state.
        If present, it will hit up Firestore for the user’s saved custom data.
        If null, it will return an Observable.of(null). */
    this.user = this.afAuth.authState
      .switchMap((user) => {
        if (user) {
          // todo: upsert
          return this.db.doc$(`people/${user.uid}`);
        } else {
          return Observable.of(null);
        }
      });
    // Now we subscribe to the User Observable and save some details
    this.user.subscribe(
      (user) => {
        if (user) {
          this.userId = user.uid;
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
  get uid(): string {
    return this.authenticated ? this.userDetails.uid : '';
  }
  // Returns current user display name or Guest
  get displayName(): string {
    return this.userDetails.displayName || this.userDetails.email;
  }
  // Returns current user photo
  get photoURL(): string {
    return this.userDetails.photoURL || '';
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
        // this.toast.update('Welcome to STREAM!!!', 'success');
        return this.upsertUserData(user);
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
        // this.toast.update('Welcome to STREAM!!!', 'success');
        return this.upsertUserData(user);
      })
      .catch((error) => this.handleError(error));
  }

  emailLogin(email: string, password: string) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then((user) => {
        // this.toast.update('Welcome to STREAM!!!', 'success')
        return this.upsertUserData(user);
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


    this.afAuth.auth.signOut();
  }

  // If error, console log and toast user
  private handleError(error: Error) {
    console.error(error);
    this.toast.sendErrorMsg(error.message);
  }

  // Sets user data to firestore after succesful login
  public upsertUserData(user: User, data?: any) {

    const newUser: User = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || data.displayName,
      photoURL: user.photoURL || 'https://goo.gl/Fz9nrQ',
    };

    return this.db.upsert(`people/${user.uid}`, newUser);
  }
}
