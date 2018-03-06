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
    const updateObj = {};
    updateObj[`/people/${this.auth.uid}/posts/${postId}`] = null;
    updateObj[`/posts/${postId}`] = null;
    updateObj[`/feed/${this.auth.uid}/posts/${postId}`] = null;
    console.log(postId);
    return this.db.batch(updateObj, 'delete').then(
      this.toast.sendOkMsg('POST GELÖSCHT', 'OK')
    );
  }
}
