enum TokenType {
  // Literals
  INT,
  FLOAT,
  STRING,
  BOOLEAN,
  NULL,

  ASSUMED_STR,
  ASSUMED_INT,
  ASSUMED_FLOAT,
  ASSUMED_BOOL,
  ASSUMED_NULL,
  ASSUMED_FUNCTION,
  ASSUMED_ARRAY,
  ASSUMED_VALUE,

  // Operators
  PLUS,
  MINUS,
  MULTIPLY,
  DIVIDE,
  MODULO,
  POWER,

  // Keywords

  // -- Typed
  globalVar,
  localVar,
  functionVar,
  classVar,
  interfaceVar,
  intVar,
  floatVar,
  stringVar,
  booleanVar,
  nullVar,
  anyVar,
  moduleVar,
  
  IF,
  ELSE,
  WHILE,
  DO,
  FOR,
  IN,

  MAGIC, // ~
  MAGICBLOCK, // ~ {...}
  
  // Separators
  COMMA, // ,
  COLON, // :
  SEMICOLON, // ;
  RECALLPERD, // \.

  // Blocks
  OPEN_BRACKET,
  CLOSE_BRACKET,
  OPEN_CURLY,
  CLOSE_CURLY,
  OPEN_SQUARE,
  CLOSE_SQUARE,

  // Tags
  OPEN_ANGLE,
  CLOSE_ANGLE,

  // Cowfml tags
  // <superkey: "hey">
  COW_KEY,
  COW_VALUE,

  RAW_STRING,

  // [hey]
  BLOCKHEADER,
  // [/]
  BHCLOSER,
  
  // <hey>
  ARROWHEADER,
  // </>
  ARROWCLOSER,
  
  EOF,
}

const KEYWORDS: Record<string, TokenType> = {
  '=>': TokenType.globalVar,
  '->': TokenType.localVar,
  '=)': TokenType.functionVar,
  '*)': TokenType.classVar,
  '!)': TokenType.interfaceVar,
  '%)': TokenType.intVar,
  '$)': TokenType.floatVar,
  '^)': TokenType.stringVar,
  '&)': TokenType.booleanVar,
  '~)': TokenType.nullVar,
  '?)': TokenType.anyVar,
  '@)': TokenType.moduleVar,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'while': TokenType.WHILE,
  'do': TokenType.DO,
  'for': TokenType.FOR,
  'in': TokenType.IN,
};

interface Token {
  type: TokenType;
  name: string;
  pos: number;
}

type NotUndefined = Exclude<unknown, undefined>;

const COWF = {
  getBlock: (string: string, startingIndex: number, delim: string): string => {
    // Get the next delim index
    let delimIndex = string.indexOf(delim, startingIndex);
    // If the delim is not found, return the rest of the string
    if (delimIndex === -1) {
      return string.substring(startingIndex);
    }

    // Otherwise, return the block of the string
    return string.substring(startingIndex, delimIndex);
  },

  extractKeyTag: (string: string): string => {
    /* <{ KEY }: { VALUE }> => <foo: "bar"> */

    let trimmed

    return ''
  },

  token: (name: string, type: any, pos: number): Token => {
    return {
      name,
      type,
      pos,
    }
  },

  isAlpha: (char: string): boolean => {
    return char.toUpperCase() != char.toLowerCase();
  },

  is: /* fn is(x) fn(y) x = y */ (x: number) => (y: number) => x === y,
  constantly: (x: number) => () => x,
  baseIterator: (v: any) => {
    if (typeof v === 'string') {
      return ''
    } else if (Array.isArray(v)) {
      return []
    } else if (typeof v === 'object') {
      return {}
    }
  },

  isInt: (x: number): boolean => x === Math.floor(x),
  isFloat: (x: number): boolean => x === Math.round(x),

  typeOf: (val: any): string => val?.constructor?.name || 'null',

  contains: (arr: any[], val: any): boolean => arr.includes(val),

  isReserved: (name: string): TokenType => KEYWORDS[name],

  isSkippable: (char: string): boolean => {
    return char === ' ' || char === '\n' || char === '\t';
  },

  isEven: (num: number): boolean => num % 2 === 0,
  isOdd: (num: number): boolean => num % 2 === 1,

  parse: function(text: string): Token[] {
    const split: string[] = text.split(/\b| +/g);
    var contextBucket: Token[] = [];
    var returnObj: Record<string, any> = {};

    const states = {
      POS: 0,
      
      arrayBlock: {
        active: false,
        openCount: 0,
        closeCount: 0,
        mode: {
          isHeader: false,
          isArray: false,
        },
        methods: {
          header() {
            states.arrayBlock.mode.isHeader = true;
            states.arrayBlock.mode.isArray = false;
          },
          
          array() {
            states.arrayBlock.mode.isHeader = false;
            states.arrayBlock.mode.isArray = true;
          },

          isOpen() {
            return states.arrayBlock.openCount - states.arrayBlock.closeCount != 0;
          }
        }
      },
      
      sawBlock: {
        active: false,
        openCount: 0,
        closeCount: 0,
        mode: {
          dict: false,
          syntax: false,
        },
        methods: {
          dict() {
            states.sawBlock.mode.dict = true;
            states.sawBlock.mode.syntax = false;
          },
          
          syntax() {
            states.sawBlock.mode.dict = false;
            states.sawBlock.mode.syntax = true;
          },

          isOpen() {
            return states.sawBlock.openCount - states.sawBlock.closeCount != 0;
          }
        }
      },
      
      tagBlock: {
        active: false,
        openCount: 0,
        closeCount: 0,
        mode: {
          html: false,
          cowfml: false,
        },
        methods: {
          html() {
            states.tagBlock.mode.html = true;
            states.tagBlock.mode.cowfml = false;
          },
          
          cowfml() {
            states.tagBlock.mode.html = false;
            states.tagBlock.mode.cowfml = true;
          },

          isOpen() {
            return states.tagBlock.openCount - states.tagBlock.closeCount != 0;
          }
        }
      },
      
      divend: {
        active: false,
        openCount: 0,
        closeCount: 0,
        or: {
          front: false,
          back: false,
          midtext: false,
        },
        mode: {
          sep: false,
          atom: false,
        },
        methods: {
          sep() {
            states.divend.mode.sep = true;
            states.divend.mode.atom = false;
          },
          
          atom() {
            states.divend.mode.sep = false;
            states.divend.mode.atom = true;
          },

          isOpen() {
            return states.divend.openCount - states.divend.closeCount != 0;
          }
        }
      },
    };

    split.forEach((word, i) => {
      states.POS = i;
      const trimmedWord: string = word
        .replaceAll('\n', '\\n')
        .trim()
        .replaceAll('\\n', '\n')
        ;

      const startsWith = (prefix: string, trim?: NotUndefined) =>
        trim
          ? trimmedWord.trim().startsWith(prefix)
          : trimmedWord.startsWith(prefix)
        ;

      const endsWith = (suffix: string, trim?: NotUndefined) =>
        trim
          ? trimmedWord.trim().endsWith(suffix)
          : trimmedWord.endsWith(suffix)
        ;

      const contains = (value: string, trim?: NotUndefined) =>
        trim
          ? trimmedWord.trim().includes(value)
          : trimmedWord.includes(value)
        ;
        
      const getNextWord = (index: number) => {
        const nextWord = split[index];
        return nextWord ? nextWord : '';
      };

      const getUntilWord = (arr: string[], pos: number, word: string) => {
        const arrIndex = arr.indexOf(word);
        if (arrIndex === -1) {
          return '';
        }
        return arr.slice(pos, arrIndex).join(' ');
      };
      
      const getNextWordIs = (index: number, func: (x: string) => boolean) => {
        const nextWord = getNextWord(index);
        return func(nextWord);
      };

      const len = () => trimmedWord.length

      const addToLastBucket = (token: Token) => {
        contextBucket[contextBucket.length - 1].name += token.name;
      };
      // console.log(trimmedWord, startsWith('{'), endsWith('}', 1))
      // console.log(trimmedWord, startsWith('['), endsWith(']', 1))

      if (startsWith('[', 1)) {
        states.arrayBlock.active = true;
        states.arrayBlock.openCount++;

        contextBucket.push(
          COWF.token(trimmedWord, TokenType.OPEN_SQUARE, states.POS)
        );
      }

      else if (endsWith(']', 1)) {
        states.arrayBlock.active = false;
        states.arrayBlock.closeCount++;
        contextBucket.push(
          COWF.token(trimmedWord, TokenType.CLOSE_SQUARE, states.POS)
        );
      }

      else if (startsWith('{', 1)) {
        states.sawBlock.active = true;
        states.sawBlock.openCount++;
        contextBucket.push(
          COWF.token(trimmedWord, TokenType.OPEN_CURLY, states.POS)
        );
      }

      else if (endsWith('}', 1)) {
        states.sawBlock.active = false;
        states.sawBlock.closeCount++;
        contextBucket.push(
          COWF.token(trimmedWord, TokenType.CLOSE_CURLY, states.POS)
        );
      }

      else if (startsWith('<', 1)) {
        states.tagBlock.active = true;
        states.tagBlock.openCount++;
        contextBucket.push(
          COWF.token(trimmedWord, TokenType.OPEN_ANGLE, states.POS)
        );
      }

      else if (endsWith('>', 1)) {
        states.tagBlock.active = false;
        states.tagBlock.closeCount++;
        contextBucket.push(
          COWF.token(trimmedWord, TokenType.CLOSE_ANGLE, states.POS)
        );
      }

      else if (contains(':', 1)) {
        if (startsWith(':', 1)) {}
        
        else if (startsWith(':', 0)) {}
        
        contextBucket.push(
          COWF.token(trimmedWord, TokenType.COLON, states.POS)
        );
      }

      else if (states.arrayBlock.active) {
        if (startsWith('"', 1) || startsWith("'", 1)) {
          const endIndex = trimmedWord.indexOf('"');
          const val = trimmedWord.slice(1, endIndex);
          contextBucket.push(COWF.token(val, TokenType.STRING, states.POS));
        }

        else {
          contextBucket.push(COWF.token(trimmedWord, TokenType.BLOCKHEADER, states.POS));
        }
        
      }

      else if (states.tagBlock.active) {
        if (startsWith('"', 1) || startsWith("'", 1)) {
          const endIndex = trimmedWord.indexOf('"');
          const val = trimmedWord.slice(1, endIndex);
          contextBucket.push(COWF.token(val, TokenType.STRING, states.POS));
        }

        else {
          contextBucket.push(COWF.token(trimmedWord, TokenType.RAW_STRING, states.POS));
        }
        
      }

      else if (states.sawBlock.active) {
        if (startsWith('"', 1) || startsWith("'", 1)) {
          const endIndex = trimmedWord.indexOf('"');
          const val = trimmedWord.slice(1, endIndex);
          contextBucket.push(COWF.token(val, TokenType.STRING, states.POS));
        }

        else {
          contextBucket.push(COWF.token(trimmedWord, TokenType.RAW_STRING, states.POS));
        }
      }

      else if (COWF.isAlpha(trimmedWord)) {

        // Reserved?
        let r_ = COWF.isReserved(trimmedWord)
        if (r_) {
          contextBucket.push(COWF.token(trimmedWord, r_, states.POS));
        } else {
          if (startsWith('"', 1) || startsWith("'", 1)) {
            const endIndex = trimmedWord.indexOf('"');
            const val = trimmedWord.slice(1, endIndex);
            contextBucket.push(COWF.token(val, TokenType.STRING, states.POS));
          } else {
            contextBucket.push(COWF.token(trimmedWord, TokenType.RAW_STRING, states.POS));
          }
        }
        
      }

      else if (COWF.isInt(parseInt(trimmedWord))) {
        contextBucket.push(COWF.token(trimmedWord, TokenType.INT, states.POS));
      } 

      else if (COWF.isFloat(parseInt(trimmedWord))) {
        contextBucket.push(COWF.token(trimmedWord, TokenType.FLOAT, states.POS));
      }

      console.log(word, '  |  ', states, contextBucket)

    });

    contextBucket.push(COWF.token('', TokenType.EOF, states.POS));

    return contextBucket;
  },
};

(globalThis?.window && window?.location) && (
  Object.assign(window, { COWF })
)
 ||
(globalThis?.module && globalThis?.__dirname) && (
  module.exports = { COWF }
)

COWF.parse('{ hello: "world" }');