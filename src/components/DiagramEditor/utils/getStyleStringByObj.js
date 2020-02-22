export default function getStyleStringByObj(styles) {
  return Object.keys(styles).reduce((prev, current) => {
    if (current !== "perimeter") {
      return prev + ";" + current + "=" + styles[current];
    }
    return prev;
  }, "");
}
