import { Component, OnInit } from '@angular/core';
import { AuthService } from '@app/core';
import { Router } from '@angular/router';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { ToastService } from '@app/core';
import { AngularFireAuth } from 'angularfire2/auth';

/** @title Login */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  lemail = new FormControl('', [Validators.required]);
  lpassword = new FormControl('', [Validators.required]);

  sname = new FormControl('', [Validators.required]);
  semail = new FormControl('', [Validators.required]);
  spassword = new FormControl('', [Validators.required]);
  spasswordcheck = new FormControl('', [Validators.required]);
  step = 'open';

  authError = 'errorrr';
  hidePassword = true;

  constructor(public auth: AuthService,
    private router: Router,
    public fb: FormBuilder,
    private toast: ToastService,
    public afAuth: AngularFireAuth) { }

  ngOnInit() {

  }
  getSNErrorMessage() {
    return this.sname.hasError('required') ? 'Name wird benötigt.' : '';
  }
  getSEErrorMessage() {
    return this.semail.hasError('required') ? 'E-Mail wird benötigt.' : '';
  }

  getSPErrorMessage() {
    return this.spassword.hasError('required') ? 'Passwortwird benötigt.' : '';
  }

  getSPCErrorMessage() {
    return this.spasswordcheck.hasError('required') ? 'Passwort wird benötigt.' : '';
  }
  getLEErrorMessage() {
    return this.lemail.hasError('required') ? 'E-Mail wird benötigt.' : '';
  }

  getLPErrorMessage() {
    return this.lpassword.hasError('required') ? 'Passwort wird benötigt.' : '';
  }
  loginWithGoogle() {
    this.auth.googleLogin().then(() => {
      this.router.navigate(['/']);
    });
  }
  // Step 1
  signup() {
    if (this.spassword.value !== this.spasswordcheck.value) {
      this.toast.sendMsg('Die Passwörter stimmen nicht überein.');
      return;
    }
    return this.afAuth.auth.createUserWithEmailAndPassword(this.semail.value, this.spassword.value)
      .then((user) => {
        this.toast.sendMsg('Konto erstellt. Sie können sich anmelden.');
        this.step = 'signed';
        this.auth.upsertUserData(user, { displayName: this.sname.value });
      })
      .catch((error) => {
        this.handleError(error);
      });
  }
  emailLogin() {
    return this.afAuth.auth.signInWithEmailAndPassword(this.lemail.value, this.lpassword.value)
      .then((user) => {
        this.router.navigate(['/']);
        this.auth.upsertUserData(user);
      })
      .catch((error) => this.handleError(error));
  }
  handleError(error: any) {
    const errorCode = error.code;
    this.toast.sendMsg(authErrorCodes[errorCode]);
  }
  // Step 2
  setCatchPhrase(user) {
    return this.auth.upsertUserData(user, { displayName: this.sname.value });
  }
  /*   loginWithEmail() {
      this.auth.emailLogin(this.email, this.password).then(() => {
        this.router.navigate(['/']);
      });
    } */
  registerWithEmail() {

  }
}
const authErrorCodes = {
  // link
  'auth/provider-already-linked': 'auth/provider-already-linked',
  'auth/invalid-credential': 'auth/invalid-credential',
  'auth/credential-already-in-use': 'auth/credential-already-in-use',
  'auth/email-already-in-use': 'Diese E-Mail ist schon registriert',
  'auth/operation-not-allowed': 'auth/operation-not-allowed',
  'auth/invalid-email': 'Ungültige E-Mail',
  'auth/wrong-password': 'Falsches Password',
  // linkWithPopup
  'auth/auth-domain-config-required': 'auth/auth-domain-config-required',
  'auth/cancelled-popup-request': 'auth/cancelled-popup-request',
  'auth/popup-blocked': 'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment': 'auth/operation-not-supported-in-this-environment',
  'auth/popup-closed-by-user': 'auth/popup-closed-by-user',
  'auth/unauthorized-domain': 'auth/unauthorized-domain',
  // linkWithRedirect
  // reauthenticate
  'auth/user-mismatch': 'auth/user-mismatch',
  'auth/user-not-found': 'auth/user-not-found',
  // updateEmail
  'auth/requires-recent-login': 'auth/requires-recent-login',
  // updatePassword
  'auth/weak-password': 'Passwort zu schwach: 6 bis 24 Zeichen',
  // common errors
  'auth/app-deleted': 'auth/app-deleted',
  'auth/app-not-authorized': 'auth/app-not-authorized',
  'auth/argument-error': 'auth/argument-error',
  'auth/invalid-api-key': 'auth/invalid-api-key',
  'auth/invalid-user-token': 'auth/invalid-user-token',
  'auth/network-request-failed': 'auth/network-request-failed',
  'auth/too-many-requests': 'auth/too-many-requests',
  'auth/user-disabled': 'auth/user-disabled',
  'auth/user-token-expired': 'auth/user-token-expired',
  'auth/web-storage-unsupported': 'auth/web-storage-unsupported'
};
