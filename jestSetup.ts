beforeAll(() => {
  Array.prototype.last = function (): unknown {
    if (this.length > 0) {
      return this[this.length - 1];
    }
    return undefined;
  };
});
