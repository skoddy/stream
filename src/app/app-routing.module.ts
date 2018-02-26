import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoreModule } from './core/core.module';
import { MainComponent } from './main/main.component';
import { LoginComponent } from './login/login.component';
import { PostListComponent } from './features/posts/post-list/post-list.component';
import { UserListComponent } from './features/user/user-list/user-list.component';
import { AuthGuard } from '@app/core';
import { ProfileComponent } from '@app/features/profile/profile.component';
const routes: Routes = [
  { path: '', redirectTo: '/main/posts', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'main', component: MainComponent, canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/main/posts', pathMatch: 'full' },
      { path: 'posts', component: PostListComponent },
      { path: 'userlist', component: UserListComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  { path: '**', component: LoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
