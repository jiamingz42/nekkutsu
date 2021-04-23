import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import webvtt from 'node-webvtt';

export interface Caption {
  id: number;
  start: number;
  end: number;
  text: string;
}

@Component({
  selector: 'app-subtitle',
  templateUrl: './subtitle.page.html',
  styleUrls: ['./subtitle.page.scss'],
})
export class SubtitlePage implements OnInit {
  constructor() {}

  activeId: number = 0;
  captions: Caption[] = null;

  @ViewChild('content', { static: false }) content: IonContent;

  ngOnInit() {
    const self = this;
    fetch('assets/mp3/S01E01.vtt')
      .then(function (response) {
        return response.text();
      })
      .then(function (text) {
        const result = webvtt.parse(text, { strict: false });
        self.captions = result.cues.map((cue, index: number) => ({
          id: index,
          start: cue.start,
          end: cue.end,
          text: cue.text,
        }));
      });
  }

  prev() {
    if (this.activeId > 0) {
      this.activeId -= 1;
    }
  }
  next() {
    if (this.captions && this.activeId < this.captions.length) {
      this.activeId += 1;
    }
  }

  scroll() {
    this.content.scrollByPoint(0, 1000, 500);
  }
}
