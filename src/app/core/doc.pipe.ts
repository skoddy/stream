import { Pipe, PipeTransform } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Observable } from 'rxjs/Observable';
@Pipe({
  name: 'doc'
})
export class DocPipe implements PipeTransform {

  constructor(private db: FirebaseService) {}

  transform(value: any): Observable<any> {
    return this.db.doc$(value.path);
  }
}
