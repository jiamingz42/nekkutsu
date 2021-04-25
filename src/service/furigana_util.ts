import { Furigana } from '../model/furigana';

import * as furigana from 'furigana';
import * as Kuroshiro from 'kuroshiro';
import * as KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

const charOpts = {
  to: 'hiragana',
  mode: 'furigana',
  delimiter_start: '[',
  delimiter_end: ']',
};

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
