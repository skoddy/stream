import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '@app/core/firebase.service';
import { Observable } from 'rxjs/Observable';
import { User } from '../../../user-model';
@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {

  userRef: any;
  constructor(private router: ActivatedRoute, private db: FirebaseService) {
    this.userRef = this.db.doc$(`users/${this.router.snapshot.paramMap.get('uid')}`);
    console.log(this.router.snapshot.paramMap.get('uid'));
    console.log(this.userRef);
   }

  ngOnInit() {

  }

}
