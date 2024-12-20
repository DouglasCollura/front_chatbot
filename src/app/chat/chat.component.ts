import { ChangeDetectionStrategy, Component, inject, SecurityContext, signal, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as RecordRTC from 'recordrtc';
import { ChatService } from '../shared/services/chat.service';
import { CommonModule } from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone:true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {

  @ViewChild('uploader') ElementRef: any;
  private domSanitizer = inject(DomSanitizer);
  private chatService = inject(ChatService);

  record:any;
  recording = signal<boolean>(false);

  url = signal<any>(null);
  error: any;
  blob! :Blob;

  chat = new FormControl();

  public minutes = signal<number>(0);
  public seconds = signal<number>(0);
  private timer = signal<any>(null);
  public messages = signal<any[]>([])

  loadingRequest = signal<boolean>(false);


  sanitize(url: string){
   return this.domSanitizer.sanitize(SecurityContext.HTML, url);
  }

  startRecording() {
    this.recording.set(true);
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    }).then(
      this.successCallback.bind(this),this.errorCallback.bind(this)
    )
  }

  successCallback(stream: MediaStream){

    let StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
    this.record = new StereoAudioRecorder(stream, {
      type: 'audio',
      // mimeType: 'audio/wav'
    });
    this.startTimer()
    this.record.record();
  }

  stopRecording(){
    this.record.stop(this.processRecording.bind(this));
  }

  processRecording(blob: Blob){
    this.blob = blob;
    this.stopTimer()
    this.sendAudio()
    console.log(this.record)
    this.url.set(URL.createObjectURL(blob));

    this.messages.update(mes=> [...mes, {sender:'user', type:'audio', content:URL.createObjectURL(blob)}])

    this.recording.set(false);
  }

  errorCallback(error: any){
    this.error = this.domSanitizer.sanitize(SecurityContext.HTML, error.message);
    this.recording.set(false);
  }

  sendAudio(){
    this.loadingRequest.set(true);
    let formData = new FormData();
    console.log('Recording complete!', this.blob);
    formData.append('files', this.blob, 'audio.webm');

    this.chatService.sendAudio(formData).subscribe((response) => {
      console.log(response);
      this.loadingRequest.set(false);
      this.messages.update(mes=> [...mes, {sender:'bot', type:'text', content:response.message}])

    }, (error) => {
      console.error(error);
      this.loadingRequest.set(false);
    });
  }

  sendFile(file:any){
    this.loadingRequest.set(true);
    let formData = new FormData();
    formData.append('files', file, 'file.pdf');

    this.chatService.sendFile(formData).subscribe((response) => {
      console.log(response);
      this.loadingRequest.set(false);
      this.messages.update(mes=> [...mes, {sender:'bot', type:'text', content:response.message}])

    }, (error) => {
      console.error(error);
      this.loadingRequest.set(false);
    });
  }


  startTimer() {
    if (!this.timer()) {
      this.timer.set(setInterval(() => this.updateTime(), 1000));
    }
  }

  stopTimer() {
    if (this.timer()) {
      clearInterval(this.timer());
      this.timer.set(null);
    }
  }

  private updateTime() {
    this.seconds.set(this.seconds()+ 1);
    if (this.seconds() === 60) {
      this.seconds.set(0);
      this.minutes.set(this.seconds()+ 1);
    }
  }


  sendText(){
    if(!this.chat.value){
      return
    }
    this.messages.update(mes=> [...mes, {sender:'user', type:'text', content:this.chat.value}])
    this.chat.reset();
  }

  getFile({target:{files}}:any){
    console.log(files[0])
    this.sendFile(files[0])
    this.messages.update(mes=> [...mes, {sender:'user', type:'file', content:files[0].name, size:this.transform(files[0].size)}])
    this.ElementRef.nativeElement.value = ''; // clear the file input after sending
  }

  transform(size: number): string {
    if (size === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
