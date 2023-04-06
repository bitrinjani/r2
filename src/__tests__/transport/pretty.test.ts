import { pretty } from '../../transport/transform';
import { Readable } from 'stream';

it('pretty', () => {
  const result = pretty({ colorize: true, withLabel: true, debug: true } as any);  
  const stream = new Readable();
  stream.push('{ "msg": "Test message", "time": 1514074545477, "level": 40, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);  
});

it('pretty no label', () => {
  const result = pretty({ colorize: true, withLabel: false, debug: true } as any);  
  const stream = new Readable();
  stream.push('{ "msg": "Test message", "time": 1514074545477, "level": 40, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);  
});

it('pretty debug', () => {
  const result = pretty({ colorize: true, withLabel: true, debug: true } as any);  
  const stream = new Readable();
  stream.push('{ "msg": "Test message", "time": 1514074545477, "level": 20, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);  
});

it('pretty no debug', () => {
  const result = pretty({ colorize: true, withLabel: true, debug: false } as any);  
  const stream = new Readable();
  stream.push('{ "msg": "Test message", "time": 1514074545477, "level": 20, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);  
});

it('pretty no label/debug', () => {
  const result = pretty({ colorize: true, withLabel: false, debug: false } as any);  
  const stream = new Readable();
  stream.push('{ "msg": "Test message", "time": 1514074545477, "level": 20, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);  
});

it('pretty no color/label/debug', () => {
  const result = pretty({ colorize: false, withLabel: false, debug: false } as any);  
  const stream = new Readable();
  stream.push('{ "msg": "Test message", "time": 1514074545477, "level": 20, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);  
});

it('pretty invalid json', () => {
  const result = pretty({ colorize: true, withLabel: true, debug: true } as any);  
  const stream = new Readable();
  stream.push('{ "msg": Test message", "time": 1514074545477, "level": 40, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);  
});
