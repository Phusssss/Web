
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterUnread'
})
export class FilterUnreadPipe implements PipeTransform {
  transform(notifications: any[]): any[] {
    return notifications.filter(notification => !notification.isRead);
  }
}
