import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './/app-routing.module';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
/* STREAM */
/* Firebase */
import { AngularFireModule } from 'angularfire2';
import { environment } from '../environments/environment';
export const firebaseConfig = environment.firebaseConfig;
registerLocaleData(localeDe, 'de');
// Core
import { CoreModule } from '@app/core';
import { MaterialModule } from './material.module';
import { DocPipe } from '@app/core';
// Feature Modules
import { MainComponent } from './main/main.component';
import { LoginComponent } from './login/login.component';
import { PostListComponent } from './features/posts/post-list/post-list.component';
import { PostDetailComponent } from './features/posts/post-detail/post-detail.component';
import { UserListComponent } from './features/user/user-list/user-list.component';
import { UserStatusComponent } from './features/user/user-status/user-status.component';
import { ProfileComponent } from './features/profile/profile.component';
import { PostMenuComponent } from './features/posts/post-menu/post-menu.component';
import { SubBtnComponent } from './features/user/sub-btn/sub-btn.component';
import { TestComponent } from './test/test.component';
import { OkToastComponent } from './toasts/ok-toast/ok-toast.component';
import { FailToastComponent } from './toasts/fail-toast/fail-toast.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    DocPipe,
    LoginComponent,
    PostListComponent,
    PostDetailComponent,
    UserListComponent,
    UserStatusComponent,
    ProfileComponent,
    PostMenuComponent,
    SubBtnComponent,
    TestComponent,
    OkToastComponent,
    FailToastComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    AppRoutingModule,
    CoreModule,
    AngularFireModule.initializeApp(firebaseConfig),
  ],
  entryComponents: [OkToastComponent, FailToastComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
