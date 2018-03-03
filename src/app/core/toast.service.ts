import { Injectable, Component } from '@angular/core';

import { MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs/Subject';
import { OkToastComponent } from '../toasts/ok-toast/ok-toast.component';
import { FailToastComponent } from '../toasts/fail-toast/fail-toast.component';
@Injectable()
export class ToastService {

  constructor(public snackBar: MatSnackBar) { }
  sendMsg(content: string, action?: string) {
    this.snackBar.open(content, action, {
      duration: 3000,
      horizontalPosition: 'left',
    });

  }
  sendOkMsg(content: string) {
    this.snackBar.openFromComponent(OkToastComponent, {
      data: content,
      duration: 3000,
      horizontalPosition: 'left',
    });
  }
  sendErrorMsg(content: string) {
    this.snackBar.openFromComponent(FailToastComponent, {
      data: content,
      duration: 3000,
      horizontalPosition: 'left',
    });
  }
}
