/* eslint-disable @typescript-eslint/no-explicit-any */
export type Logger = (message?: any) => void;

export function getConsoleJSONLogger(): Logger {
  BigInt.prototype['toJSON'] = function (this: bigint): string {
    return this.toString();
  };

  return (message) => {
    console.log(message);
  };
}