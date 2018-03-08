import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app/core/firebase.service';
import { AuthService } from '@app/core/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userRef: any;
  constructor(private db: FirebaseService, private auth: AuthService) {

    this.userRef = db.doc$(`users/${this.auth.uid}`);

  }

  ngOnInit() {
  }

}

