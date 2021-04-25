import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
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

main({
  text: '感じ取れたら手を繋ごう、重なるのは人生のライン and レミリア最高！',
  skipTranslate: true,
}).then((v) => console.log(v));

export interface Caption {
  id: number;
  start: number;
  end: number;
  text: string;
}

// kuroshiro.init(function (err) {
//   // kuroshiro is ready
//   var result = kuroshiro.convert('感じ取れたら手を繋ごう、重なるのは人生のライン and レミリア最高！');
//   console.log(result);
// });

@Component({
  selector: 'app-subtitle',
  templateUrl: './subtitle.page.html',
  styleUrls: ['./subtitle.page.scss'],
})
export class SubtitlePage implements OnInit {
  constructor() {}

  player: Howl = null;
  isPlaying = false;

  subtitlePath: string = 'assets/mp3/S01E01.vtt';
  audioPath: string = 'assets/mp3/S01E01.mp3';

  activeId: number = 0;
  captions: Caption[] = null;

  activeSoundId: number = null;

  furiganas: Furigana[] = null;

  @ViewChild('content', { static: false }) content: IonContent;

  ngOnInit() {
    const self = this;
    this.player = new Howl({
      src: [self.audioPath],
      onplay: () => {
        self.updateProgress();
      },
      onend: () => {},
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

  prev() {
    if (this.activeId > 0) {
      this.activateCaptionById(this.activeId - 1);
    }
  }
  next() {
    if (this.captions && this.activeId < this.captions.length) {
      this.activateCaptionById(this.activeId + 1);
    }
  }

  play() {
    this.isPlaying = true;
    this.player.play();
  }

  pause() {
    this.isPlaying = false;
    this.player.pause();
  }

  scroll() {
    // this.content.scrollByPoint(0, 1000, 500);
    this.player.play();
  }

  selectCaption(event: any) {
    const captionIdStr: string = event.currentTarget.dataset.captionId;
    const captionId: number = _.toNumber(captionIdStr);
    this.activateCaptionById(captionId);
  }

  private activateCaptionById(captionId: number) {
    const caption = this.captions[captionId];
    this.activeId = captionId;
    this.startLooping(caption.start, caption.end);
  }

  private startLooping(start: number, end: number) {
    let spriteKey = `${start}_${end}`;
    (this.player as any)._sprite[spriteKey] = [
      start * 1000,
      (end - start) * 1000,
      /* loop= */ false,
    ];

    // NOTE: Without this, you will hear two audio tracks playing at the same time
    if (this.player) {
      this.player.stop();
    }

    this.activeSoundId = this.player.play(spriteKey);
  }
  private updateProgress() {
    let seek = this.getPlayerSeek(this.player);

    setTimeout(() => {
      this.updateProgress();
    }, 100);
  }

  private getPlayerSeek(player: Howl) {
    return this.player.seek() as number;
  }
}
