import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private http = inject(HttpClient)
  private url = environment.CHATBOT_URL

  sendAudio(data:any):Observable<any>{
    let headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    headers.append('Accept', 'application/json');

   return this.http.post(`${this.url}/upload-audio`, data, { headers: headers })
  }


  sendFile(data:any):Observable<any>{
    let headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    headers.append('Accept', 'application/json');

   return this.http.post(`${this.url}/upload-file`, data, { headers: headers })
  }
}
