import { Component, OnInit } from '@angular/core';
import webvtt from 'node-webvtt';

export interface Caption {
  start: number;
  end: number;
  text: string;
}

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss'],
})
export class TrackComponent implements OnInit {
  constructor() {}

  captions: Caption[] = null;

  ngOnInit() {
    const self = this;
    fetch('assets/mp3/S01E01.vtt')
      .then(function (response) {
        return response.text();
      })
      .then(function (text) {
        const result = webvtt.parse(text, { strict: false });
        self.captions = result.cues.map((cue) => ({ start: cue.start, end: cue.end, text: cue.text }));
      });
  }
}
