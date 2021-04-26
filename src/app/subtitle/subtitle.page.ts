import {
  Component,
  OnInit,
  ViewChild,
  ViewChildren,
  Directive,
  QueryList,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonItem } from '@ionic/angular';
import webvtt from 'node-webvtt';
import { Howl } from 'howler';
import _ from 'lodash';
import { FixtureTracks } from '../fixtures';
import { Track } from '../../model/track';
import { Furigana } from '../../model/furigana';

export interface Caption {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface SpriteConfig {
  key: string;
  value: any[];
}

type SpriteConfigMap = Record<number, SpriteConfig>;

@Component({
  selector: 'app-subtitle',
  templateUrl: './subtitle.page.html',
  styleUrls: ['./subtitle.page.scss'],
})
export class SubtitlePage implements OnInit {
  track: Track = null;

  player: Howl = null;
  isPlaying = false;
  lastPlayerPosition = 0;

  subtitlePath: string = null;
  audioPath: string = null;

  activeId: number = 0;
  captions: Caption[] = [];

  activeSoundId: number = null;

  furiganas: Furigana[] = null;

  // TODO: When touchstart, display an floating button on top and temporarily disable auto-scrolling
  enableAutoScrolling = true;

  isAudioLoaded = false;

  spriteConfigMap: SpriteConfigMap = {};

  constructor(private route: ActivatedRoute) {}

  @ViewChild('content', { static: false }) content: IonContent;
  @ViewChildren('caption') captionsView: QueryList<IonItem>;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.track = FixtureTracks[id];
    this.subtitlePath = this.track.subtitlePath;
    this.audioPath = this.track.audioPath;

    const self = this;
    this.player = new Howl({
      src: [self.audioPath],
      onplay: () => {
        self.updateProgress();
      },
      onend: (soundId) => {
        if (this.activeSoundId == soundId) {
          // Reset the player position
          this.lastPlayerPosition = 0;
        } else {
          // TODO
        }
      },
      onload: () => {
        this.isAudioLoaded = true;
      },
      onpause: () => {
        this.lastPlayerPosition = this.player.seek() as number;
      },
    });
    this.activeSoundId = this.player.play();
    this.player.pause();

    fetch(this.subtitlePath)
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
        // result.cues.forEach((element) => {
        //   main({
        //     text: element.text,
        //     skipTranslate: true,
        //   }).then((v) => console.log(v));
        // });
      });
    self.furiganas = [
      { text: '私', ruby: 'わたし' },
      { text: 'は' },
      { text: '学生', ruby: 'がくせい' },
    ];
  }

  play() {
    this.playInternal();
    this.player.seek(this.lastPlayerPosition);
  }

  get activeCaption() {
    return this.captions[this.activeId];
  }

  pause() {
    this.isPlaying = false;
    this.player.pause();
  }

  selectCaption(event: any) {
    const captionIdStr: string = event.currentTarget.dataset.captionId;
    const captionId: number = _.toNumber(captionIdStr);
    if (this.isPlaying) {
      this.player.seek(this.captions[captionId].start);
    } else {
      this.activateCaptionById(captionId);
    }
  }

  logScrollStart(evt) {
    if (evt.srcElement.tagName == "ION-ICON") {
      return;
    }
    if (this.isPlaying) {
      this.enableAutoScrolling = false;
    }
  }

  resumeAutoScrolling() {
    this.enableAutoScrolling = true;
  }

  private activateCaptionById(captionId: number) {
    const caption = this.captions[captionId];
    this.activeId = captionId;
    this.startLooping(caption.start, caption.end);
  }

  private createSpriteConfig(start: number, end: number): SpriteConfig {
    return {
      key: `${start}_${end}`,
      value: [start * 1000, (end - start) * 1000, /* loop= */ false],
    };
  }

  private startLooping(start: number, end: number) {
    const spriteConfig = this.createSpriteConfig(start, end);
    this.playInternal(spriteConfig);
  }

  private playInternal(spriteConfig?: SpriteConfig) {
    // NOTE: Without this, you will hear two audio tracks playing at the same time
    if (this.player) {
      this.player.stop();
    }

    if (spriteConfig) {
      (this.player as any)._sprite[spriteConfig.key] = spriteConfig.value;
      this.player.play(spriteConfig.key);
    } else {
      this.player.play(this.activeSoundId);
      this.isPlaying = true;
    }
  }

  private updateProgress() {
    // Stop updating progress when the player stops / pauses
    if (!this.player || !this.player.playing()) {
      return;
    }

    let seek = this.getPlayerSeek(this.player);

    const matchedCaption = _.find(
      this.captions,
      (c) => c.start <= seek && seek <= c.end
    );
    if (matchedCaption && this.activeId != matchedCaption.id) {
      this.activeId = matchedCaption.id;
      if (this.enableAutoScrolling) {
        const itemOffsetTop = this.getOffsetTop(
          this.captionsView,
          this.activeId
        );
        const firstItemOffsetTop = this.getOffsetTop(this.captionsView, 0);
        this.content.scrollToPoint(
          0,
          itemOffsetTop - firstItemOffsetTop - 350 /* TODO: Hard-coded */,
          1000
        );
      }
    }

    setTimeout(() => {
      this.updateProgress();
    }, 500);
  }

  private getOffsetTop(captionsView: QueryList<IonItem>, index: number) {
    const item: IonItem = this.captionsView.get(index);
    return item['el'].offsetTop;
  }

  private getPlayerSeek(player: Howl) {
    return this.player.seek() as number;
  }
}
