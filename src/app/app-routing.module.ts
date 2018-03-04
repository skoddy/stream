import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoreModule } from './core/core.module';
import { MainComponent } from './main/main.component';
import { LoginComponent } from './login/login.component';
import { PostListComponent } from './features/posts/post-list/post-list.component';
import { UserListComponent } from './features/user/user-list/user-list.component';
import { UserDetailComponent } from './features/user/user-detail/user-detail.component';
import { AuthGuard } from '@app/core';
import { ProfileComponent } from '@app/features/profile/profile.component';
import { TestComponent } from './test/test.component';
import { ViernullvierComponent } from './viernullvier/viernullvier.component';
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '', component: MainComponent, canActivate: [AuthGuard],
    children: [
      { path: '', component: PostListComponent },
      { path: 'posts', component: PostListComponent },
      { path: 'userlist', component: UserListComponent },
      { path: 'user/:uid', component: UserDetailComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'test', component: TestComponent }
    ]
  },
  { path: '**', component: ViernullvierComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
