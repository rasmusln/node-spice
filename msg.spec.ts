import { describe, it, expect } from '@jest/globals';
import { ByteSize } from './common';
import { InputsMouseMotion, InputsMousePosition } from './msg';

describe('main messages', () => {
  it('asdf', () => {
    expect(1).toBe(1);
  });
});

describe('InputsMouseMotion', () => {
  it('must serialize', () => {
    const buf = new ArrayBuffer(2 * ByteSize.Int32 + ByteSize.Uint32);
    const dv = new DataView(buf);
    dv.setInt32(0, 86, true);
    dv.setInt32(4, 724, true);
    dv.setUint32(8, 0, true);
    const expected = new Uint8Array(buf);

    const inputsMouseMotion = new InputsMouseMotion(86, 724, 0);
    const actual = inputsMouseMotion.toBuffer();

    expect(actual.byteLength).toBe(expected.byteLength);
    expect(actual).toEqual(expected);
  });

  it('must deserialize', () => {
    const buffer = new ArrayBuffer(2 * ByteSize.Int32 + ByteSize.Uint32);
    const dv = new DataView(buffer);
    dv.setInt32(0, 100, true);
    dv.setInt32(4, 200, true);
    dv.setUint32(8, 1 << 1, true);

    const mouseMotion = InputsMouseMotion.fromBuffer(buffer);

    expect(mouseMotion.dx).toBe(100);
    expect(mouseMotion.dy).toBe(200);
    expect(mouseMotion.buttonsState).toBe(1 << 1);
  });
});

describe('InputsMousePosition', () => {
  it('must serialize', () => {
    const buf = new ArrayBuffer(3 * ByteSize.Uint32 + ByteSize.Uint8);
    const dv = new DataView(buf);
    dv.setUint32(0, 50, true);
    dv.setUint32(4, 100, true);
    dv.setUint32(8, 1, true);
    dv.setUint8(12, 0);
    const expected = new Uint8Array(buf);

    const inputsMousePosition = new InputsMousePosition(50, 100, 1, 0);
    const actual = inputsMousePosition.toBuffer();

    expect(actual.byteLength).toBe(expected.byteLength);
    expect(actual).toStrictEqual(expected);
  });
});

// describe('InputsMousePress', () => {
// });

// describe('InputsMouseRelease', () => {
// });
