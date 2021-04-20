import { Howl } from 'howler';
import { Component, ViewChild } from '@angular/core';
import { IonRange } from '@ionic/angular';

export interface Track {
  name: string;
  path: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  playlist: Track[] = [
    {
      name: 'S01E01',
      path: './assets/mp3/S01E01.mp3',
    },
    {
      name: 'S01E08',
      path: './assets/mp3/S01E08.mp3',
    },
  ];

  activeTrack: Track = null;
  player: Howl = null;
  isPlaying = false;

  progress = 0; // %
  progress_abs = '';
  progress_max = 1000;

  @ViewChild('range', { static: false }) range: IonRange;

  constructor() {}

  start(track: Track) {
    if (this.player) {
      this.player.stop();
    }
    this.player = new Howl({
      src: [track.path],
      onplay: () => {
        this.activeTrack = track;
        this.isPlaying = true;
        this.updateProgress();
      },
      onend: () => {},
    });
    this.player.play();
  }

  togglePlayer(pause) {
    this.isPlaying = !pause;
    if (pause) {
      this.player.pause();
    } else {
      this.player.play();
    }
  }

  next() {
    let index = this.playlist.indexOf(this.activeTrack);
    if (index != this.playlist.length - 1) {
      this.start(this.playlist[index + 1]);
    } else {
      this.start(this.playlist[0]);
    }
  }

  prev() {
    let index = this.playlist.indexOf(this.activeTrack);
    if (index > 0) {
      this.start(this.playlist[index - 1]);
    } else {
      this.start(this.playlist[this.playlist.length - 1]);
    }
  }

  seek() {
    let newValue = +this.range.value;
    let duration = this.player.duration();
    this.player.seek(duration * (newValue / this.progress_max));
  }

  updateProgress() {
    let seek = this.player.seek();
    this.progress_abs = this.convertToReadableTimestamp(seek);
    this.progress = (seek / this.player.duration()) * this.progress_max || 0;
    setTimeout(() => {
      this.updateProgress();
    }, 100);
  }

  // Example
  //   70.0 => 01:10
  //  123.4 => 02:03
  private convertToReadableTimestamp(position: number) {
    let mm = Math.floor(position / 60);
    let ss = Math.floor(position % 60);
    return `${this.padZero(mm)}:${this.padZero(ss)}`;
  }

  // NOTE: Assume 0 <= num < 100
  private padZero(num: number): string {
    if (0 <= num && num < 10) {
      return `0${num}`;
    } else {
      return `${num}`;
    }
  }
}
