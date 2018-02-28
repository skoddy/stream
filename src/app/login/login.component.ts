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


  semail = new FormControl('', [Validators.required]);
  spassword = new FormControl('', [Validators.required]);
  spasswordcheck = new FormControl('', [Validators.required]);
  sname: string;

  authError = 'errorrr';
  hidePassword = true;

  constructor(public auth: AuthService,
    private router: Router,
    public fb: FormBuilder,
    private toast: ToastService,
    public afAuth: AngularFireAuth) { }

  ngOnInit() {

  }

  getSEErrorMessage() {
    return this.semail.hasError('required') ? 'You must enter a value' : '';
  }

  getSPErrorMessage() {
    return this.spassword.hasError('required') ? 'You must enter a value' : '';
  }

  getSPCErrorMessage() {
    return this.spasswordcheck.hasError('required') ? 'You must enter a value' : '';
  }
  getLEErrorMessage() {
    return this.lemail.hasError('required') ? 'You must enter a value' : '';
  }

  getLPErrorMessage() {
    return this.lpassword.hasError('required') ? 'You must enter a value' : '';
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
        this.toast.sendMsg('Welcome to STREAM!!!');
        return this.auth.upsertUserData(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        this.authError = errorMessage;
        this.toast.sendMsg(errorMessage);
      });
  }

  // Step 2
  setCatchPhrase(user) {
    return this.auth.upsertUserData(user, { displayName: this.sname });
  }
  /*   loginWithEmail() {
      this.auth.emailLogin(this.email, this.password).then(() => {
        this.router.navigate(['/']);
      });
    } */
  registerWithEmail() {

  }

}
