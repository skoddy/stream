import { Component, Input } from '@angular/core';
import { FirebaseService, ToastService  } from '@app/core';
export interface Post {
  id?: string;
  content: string;
  category: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  uid: string;
}

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})

export class PostDetailComponent {
  @Input()
  post: Post;
  constructor(private db: FirebaseService, private toast: ToastService) { }

}
