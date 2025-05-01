import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { StaffService } from '../services/staff.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef; // Reference to the messages div
  
  currentStaffUid: string | null = localStorage.getItem('staffUid');
  staffList: any[] = [];
  selectedStaff: any = null;
  messages: any[] = [];
  newMessage: string = '';
  isMobile: boolean = false;
  showStaffList: boolean = true;
  
  constructor(
    private chatService: ChatService,
    private staffService: StaffService
  ) {}
  
  ngOnInit() {
    if (this.currentStaffUid) {
      this.loadStaffList();
    }
    this.checkScreenSize();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }
  
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    this.showStaffList = !this.isMobile;
  }
  
  toggleStaffList() {
    this.showStaffList = !this.showStaffList;
  }
  
  ngAfterViewChecked() {
    this.scrollToBottom(); // Scroll to bottom after view updates
  }
  
  loadStaffList() {
    const parentUid = JSON.parse(localStorage.getItem('selectedStaff') || '{}').parentUid;
    this.staffService.getStaffByParent(parentUid).subscribe(data => {
      this.staffList = data.filter(staff => staff.uid !== this.currentStaffUid);
    });
  }
  
  selectStaff(staff: any) {
    this.selectedStaff = staff;
    this.loadMessages();
    // Auto hide staff list on mobile after selection
    if (this.isMobile) {
      this.showStaffList = false;
    }
  }
  
  loadMessages() {
    if (this.currentStaffUid && this.selectedStaff) {
      this.chatService.getMessages(this.currentStaffUid, this.selectedStaff.uid).subscribe(messages => {
        this.messages = messages;
        this.markMessagesAsRead();
      });
    }
  }
  
  sendMessage() {
    if (this.newMessage.trim() && this.currentStaffUid && this.selectedStaff) {
      this.chatService.sendMessage(this.currentStaffUid, this.selectedStaff.uid, this.newMessage)
        .then(() => {
          this.newMessage = ''; // Clear input
        });
    }
  }
  
  markMessagesAsRead() {
    const chatRoomId = this.chatService.getChatRoomId(this.currentStaffUid!, this.selectedStaff.uid);
    this.messages
      .filter(msg => !msg.isRead && msg.receiverUid === this.currentStaffUid)
      .forEach(msg => {
        this.chatService.markMessageAsRead(chatRoomId, msg.id);
      });
  }
  
  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight; // Scroll to the bottom
    }
  }
}