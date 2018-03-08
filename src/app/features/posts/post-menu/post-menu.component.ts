import { Component, Input } from '@angular/core';
import { AuthService, FirebaseService, ToastService } from '@app/core';
@Component({
  selector: 'app-post-menu',
  templateUrl: './post-menu.component.html',
  styleUrls: ['./post-menu.component.css']
})
export class PostMenuComponent {
  @Input() id: string;
  @Input() uid: string;
  currentUid: string;
  constructor(private auth: AuthService, private db: FirebaseService, private toast: ToastService) {
    this.currentUid = auth.uid;
  }

  deletePost(postId: string) {

    console.log(postId);
    return this.db.delete(`/users/${this.auth.uid}/posts/${postId}`).then(
      this.toast.sendOkMsg('POST GELÖSCHT', 'OK')
    );
  }
}
