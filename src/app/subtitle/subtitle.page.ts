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

import * as furigana from 'furigana';
import * as Kuroshiro from 'kuroshiro';
import * as KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

const charOpts = {
  to: 'hiragana',
  mode: 'furigana',
  delimiter_start: '[',
  delimiter_end: ']',
};

export interface Furigana {
  text: string;
  ruby?: string;
}

async function main({ text: _text, skipTranslate }): Promise<Furigana[]> {
  const text = _text.replace(/\s+/g, ''); // remove whitespace
  const kuroshiro = new Kuroshiro.default();
  console.dir(KuromojiAnalyzer);
  await kuroshiro.init(
    new KuromojiAnalyzer.default({ dictPath: 'assets/dict' })
  );
  const converted = await kuroshiro.convert(text, charOpts);
  const trimed = converted.replace(/<rp>(\[|\])<\/rp>/g, '');
  const regex = /^(<ruby>.*?<\/ruby>|.*?((?=<ruby>)|$))/;
  const tokens = tokenize(regex, trimed);
  return tokens.map(parseToken);
}

function tokenize(regex: RegExp, text: string): string[] {
  if (!text) {
    return [];
  }

  const match = regex.exec(text);
  if (!match) {
    return [];
  }

  const remainingText = text.substr(match[1].length);
  return [match[1]].concat(tokenize(regex, remainingText));
}

function parseToken(token: string): Furigana {
  const match = /^<ruby>(.*)<rt>(.*)<\/rt><\/ruby>/.exec(token);
  if (!match) {
    return { text: token };
  }

  return {
    text: match[1],
    ruby: match[2],
  };
}

// main({
//   text: '感じ取れたら手を繋ごう、重なるのは人生のライン and レミリア最高！',
//   skipTranslate: true,
// }).then((v) => console.log(v));

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

@Component({
  selector: 'app-subtitle',
  templateUrl: './subtitle.page.html',
  styleUrls: ['./subtitle.page.scss'],
})
export class SubtitlePage implements OnInit {
  constructor(private route : ActivatedRoute) {}
  
  id : string = null;

  player: Howl = null;
  isPlaying = false;
  lastPlayerPosition = 0;

  subtitlePath: string = 'assets/mp3/S01E01.vtt';
  audioPath: string = 'assets/mp3/S01E01.mp3';

  activeId: number = 0;
  captions: Caption[] = [];

  activeSoundId: number = null;

  furiganas: Furigana[] = null;

  isOnScrolling = false;

  isAudioLoaded = false;

  @ViewChild('content', { static: false }) content: IonContent;
  @ViewChildren('caption') captionsView: QueryList<IonItem>;

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    const self = this;
    this.player = new Howl({
      src: [self.audioPath],
      onplay: () => {
        self.updateProgress();
      },
      onend: () => {},
      onload: () => { this.isAudioLoaded = true; },
    });
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
    this.lastPlayerPosition = this.player.seek() as number;
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

  logScrollStart() {
    this.isOnScrolling = true;
  }

  logScrollEnd() {
    this.isOnScrolling = false;
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
      this.activeSoundId = this.player.play(spriteConfig.key);
    } else {
      this.activeSoundId = this.player.play();
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
      if (!this.isOnScrolling) {
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
