function max(a, b) {
    if (a > b) return a;
    else return b;
}
var ds = new Array(1, 2, 3);
console.log(ds.length, max(ds[0], ds[1]));
