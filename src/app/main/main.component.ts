import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectorRef
} from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { AuthService } from '@app/core';
import { FirebaseService } from '@app/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
})

export class MainComponent implements OnInit {
  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  constructor(
    public afAuth: AngularFireAuth,
    public authService: AuthService,
    private db: FirebaseService,
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher) {
    // media matcher
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => {
      if (!changeDetectorRef['destroyed']) {
        changeDetectorRef.detectChanges();
      }
    };
    this.mobileQuery.addListener(this._mobileQueryListener);
/*     db.inspectCol('users');
    db.inspectCol('posts');
    db.inspectDoc('users/njcHiz8vz4fI5qVtIRgKGdKqxWF2');

    this.item = db.doc$('users/njcHiz8vz4fI5qVtIRgKGdKqxWF2');
    this.itemlist = db.col$('posts');
    this.itemidlist = db.colWithIds$('posts');

    this.itemDocb = db.doc$('items/33X6TTp6FzkEE7FgfEkw');
    const itemDoc = db.doc('items/33X6TTp6FzkEE7FgfEkw');
    const userDoc = db.doc('users/njcHiz8vz4fI5qVtIRgKGdKqxWF2');
    this.db.update(itemDoc, { user: userDoc.ref });

    this.user = db.doc$('items/33X6TTp6FzkEE7FgfEkw').switchMap(doc => {
      return this.db.doc$(doc.user.path);
    });
    // create post with user reference
    const userDoc2 = db.doc('users/njcHiz8vz4fI5qVtIRgKGdKqxWF2');
    // db.add('posts', { content: 'asd', user: userDoc2.ref }); */
  }
  logout() {
    this.authService.signOut();
  }
  OnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
  ngOnInit() {
  }

}
