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
  isLaunched = false;
  fillerContent = Array(30);
  fixed = false;
  coverHeader = false;
  showHeader = false;
  showFooter = false;
  modeIndex = 0;
  darktheme: boolean;
  get mode() { return ['side', 'over', 'push'][this.modeIndex]; }
  get fixedTop() { return this.fixed && this.showHeader && !this.coverHeader ? 64 : 0; }
  get fixedBottom() { return this.fixed && this.showFooter && !this.coverHeader ? 64 : 0; }
  constructor(
    public afAuth: AngularFireAuth,
    public auth: AuthService,
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
  }
  get displayName() { return this.auth.displayName; }
  get photoURL() { return this.auth.photoURL; }
  logout() {
    this.auth.signOut();
  }
  switchTheme() {
    if (!this.darktheme) {
      this.darktheme = true;
      console.log('true');
    } else {
      this.darktheme = false;
      console.log('false');
    }
  }
  OnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
  ngOnInit() {
  }

}
