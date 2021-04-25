import { Howl } from 'howler';
import { Component, ViewChild } from '@angular/core';
import { IonRange } from '@ionic/angular';
import { Router } from '@angular/router';

export interface Track {
  id: number,
  name: string;
  path: string;
  subtitle: string;
}

export interface ABLooping {
  start?: number;
  end?: number;
}

class LoopingManager {
  sound: Howl;
  constructor(sound: Howl) {
    this.sound = sound;
  }
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  playlist: Track[] = [
    {
      id: 1,
      name: 'S01E01',
      path: './assets/mp3/S01E01.mp3',
      subtitle: './assets/mp3/S01E01.vtt',
    },
    {
      id: 2,
      name: 'S01E02',
      path: './assets/mp3/S01E02.mp3',
      subtitle: './assets/mp3/S01E02.vtt',
    },
    {
      id: 3,
      name: 'S01E03',
      path: './assets/mp3/S01E03.mp3',
      subtitle: './assets/mp3/S01E03.vtt',
    },
    {
      id: 4,
      name: 'S01E04',
      path: './assets/mp3/S01E04.mp3',
      subtitle: './assets/mp3/S01E04.vtt',
    },
    {
      id: 5,
      name: 'S01E05',
      path: './assets/mp3/S01E05.mp3',
      subtitle: './assets/mp3/S01E05.vtt',
    },
    {
      id: 6,
      name: 'S01E06',
      path: './assets/mp3/S01E06.mp3',
      subtitle: './assets/mp3/S01E06.vtt',
    },
    {
      id: 7,
      name: 'S01E07',
      path: './assets/mp3/S01E07.mp3',
      subtitle: './assets/mp3/S01E07.vtt',
    },
    {
      id: 8,
      name: 'S01E08',
      path: './assets/mp3/S01E08.mp3',
      subtitle: './assets/mp3/S01E08.vtt',
    },
  ];

  activeTrack: Track = null;
  player: Howl = null;
  isPlaying = false;

  progress = 0; // %
  progress_abs = '';
  progress_max = 1000;

  shouldUpdateProgress = true;

  abLooping: ABLooping = {};

  activeSoundId: number = null;

  @ViewChild('range', { static: false }) range: IonRange;

  constructor(private router : Router) {}

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

  togglePlayer(pause: boolean) {
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

  rewind(second: number) {
    let seek = this.getPlayerSeek(this.player);
    this.player.seek(Math.max(0, seek - second));
    this.updateProgress(/* once= */ true);
  }

  go(id) {
    this.router.navigateByUrl(`/subtitle/${id}`);
  }

  private getPlayerSeek(player: Howl) {
    return this.player.seek() as number;
  }

  seek() {
    this.toggleUpdateProgress(/* pause= */ false);
    let newValue = +this.range.value;
    let duration = this.player.duration();
    this.player.seek(duration * (newValue / this.progress_max));
  }

  updateProgress(once = false) {
    if (this.shouldUpdateProgress) {
      let seek = this.getPlayerSeek(this.player);
      this.progress_abs = this.convertToReadableTimestamp(seek);
      this.progress = (seek / this.player.duration()) * this.progress_max || 0;
    }
    if (!once) {
      setTimeout(() => {
        this.updateProgress();
      }, 100);
    }
  }

  toggleUpdateProgress(pause: boolean) {
    this.shouldUpdateProgress = !pause;
  }

  setLoopingStart() {
    this.abLooping.start = this.getPlayerSeek(this.player);
  }

  setLoopingEnd() {
    this.abLooping.end = this.getPlayerSeek(this.player);
    this.startLooping(this.abLooping);
  }

  unsetLooping() {
    delete this.abLooping.start;
    delete this.abLooping.end;
    let seek = 0;
    if (this.player) {
      seek = this.getPlayerSeek(this.player);;
      this.player.stop(this.activeSoundId);
    }
    this.player.play();
    this.player.seek(seek);
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

  private startLooping(abLooping: ABLooping) {
    let spriteKey = `${abLooping.start}_${abLooping.end}`;
    (this.player as any)._sprite[spriteKey] = [
      abLooping.start * 1000,
      (abLooping.end - abLooping.start) * 1000,
      /* loop= */ true,
    ];
    // NOTE: Without this, you will hear two audio tracks playing at the same time
    if (this.player) {
      this.player.stop();
    }
    this.activeSoundId = this.player.play(spriteKey);
  }
}
