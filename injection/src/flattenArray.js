export default (arr) => {
  while (arr.find(el => Array.isArray(el))) {
      arr = Array.prototype.concat(...arr);
  }
  return arr;
}