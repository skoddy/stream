/* 3rd party libraries */
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireDatabaseModule } from 'angularfire2/database-deprecated';
/* our own custom services  */
import { AuthService } from './auth.service';
import { UserService, UserDatabase, UserDataSource } from './user.service';
import { FirebaseService } from './firebase.service';
import { ToastService } from './toast.service';
import { AuthGuard } from './auth.guard';

@NgModule({
  imports: [
    CommonModule,
    AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence(),
    AngularFireDatabaseModule
  ],
  providers: [
    /* our own custom services  */
    AuthService,
    UserService,
    UserDatabase,
    UserDataSource,
    FirebaseService,
    ToastService,
    AuthGuard
  ]
})
export class CoreModule {
  /* make sure CoreModule is imported only by one NgModule the AppModule */
  constructor (
    @Optional() @SkipSelf() parentModule: CoreModule
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule');
    }
  }
}
