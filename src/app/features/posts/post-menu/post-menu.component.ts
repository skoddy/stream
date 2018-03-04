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

  deletePost(id: string) {
    const postRef = this.db.doc(`posts/${id}`);
    console.log(id);
    return this.db.delete(postRef).then(
      this.toast.sendOkMsg('POST GELÖSCHT', 'OK')
    );
  }
}
