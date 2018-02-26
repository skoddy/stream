import { Injectable } from '@angular/core';

import { MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class ToastService {

  constructor(public snackBar: MatSnackBar) { }
  sendMsg(content: string, action: string) {
    this.snackBar.open(content, action, {
      duration: 2000,
      horizontalPosition: 'right',
    });
  }
}
