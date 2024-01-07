// Quality of Life Helper Functions

// Use this for the number of problems to grab at a time
var N = 20;

// stolen from https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
var cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

// why doesn't vanilla js have a sequence function?
var seq = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step)); 

// zip would also be nice
var zip = (a, b) => a.map((k, i) => [k, b[i]]);

// stolen from https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function ones(x) {
    return x % 10;
}

function tens(x) {
    var head = (x - ones(x)) / 10;
    return ones(head); 
}

// Some code duplication here between runAllProbs(), runAllSols(), and runAllProbsAndSols()
function runAllProbs(c) {
    var funcs = Object.getOwnPropertyNames(c).filter(prop => typeof c[prop] === "function");
    funcs = funcs.filter(s => !s.includes('print')); // we don't want to run the debugging methods
    for (var f of funcs) {
        eval(`${c.name}.${f}()`);
        c.print_probs();
    }
}

function runAllSols(c) {
    var funcs = Object.getOwnPropertyNames(c).filter(prop => typeof c[prop] === "function");
    funcs = funcs.filter(s => !s.includes('print'));
    for (var f of funcs) {
        eval(`${c.name}.${f}()`);
        c.print_sols();
    }
}

function runAllProbsAndSols(c) {
    var funcs = Object.getOwnPropertyNames(c).filter(prop => typeof c[prop] === "function");
    funcs = funcs.filter(s => !s.includes('print'));
    for (var f of funcs) {
        eval(`${c.name}.${f}()`);
        c.print_probs_and_sols();
    }
}

// Generator Class


var Gen = class {
    constructor(dim) {
        this.dim = dim;
        this.data = []; // the list of values that we filter from
        this.filters = []; // the list of conditions
    }

    // given a number of ranges, like [1, 9], [10, 99], this creates the cartesian 
    // product of the ranges 
    range(...ranges) {
        var cartesian_args = []
        for (let i = 0; i < this.dim; ++i) {
            cartesian_args.push(seq(ranges[i][0], ranges[i][1], 1));
        }
        this.data = cartesian(...cartesian_args);
    }

    print() { // for debugging
        console.log(this.data);
    }

	  cond(lambda) { // add a condition to the list of lambda functions
    	this.filters.push(lambda);
    }
    
    generate() { // update the list of candidates
        for (let lambda of this.filters) {
            this.data = this.data.filter(lambda);
        }
        return this.data;
    }
}



// Category Class


var Category = class {
    probs = []; 
    sols = [];
    probs_and_sols = [];

    static print_probs() {
        console.log(getRandom(this.probs, N));
    }

    static print_sols() {
        console.log(getRandom(this.sols, N));
    }

    static print_probs_and_sols() {
        this.probs_and_sols = zip(this.probs, this.sols).map(v => `${v[0]} = ${v[1]}`);
        console.log(getRandom(this.probs_and_sols, N));
    }
}

// Types of Problems


// Addition

var Addition = class extends Category {

    static to_20() { // (7+7, 4+5, 9+3, etc.)
        var g = new Gen(2);
        g.range([1, 20], [1, 20]);
        g.cond(v => v[0] + v[1] <= 20);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]}`);
        this.sols = v.map(v => v[0] + v[1]);
        console.log("To 20: ");
    }

    static to_20_with_10() { // (8+4+2, 7+3+5, 6+9+1, etc.)
        var g = new Gen(3);
        g.range([1, 20], [1, 20], [1, 20]);
        g.cond(v => v[0] + v[1] == 10 || v[0] + v[2] == 10 || v[1] + v[2] == 10);
        g.cond(v => v[0] + v[1] + v[2] <= 20);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]} + ${v[2]}`);
        this.sols = v.map(v => v[0] + v[1] + v[2]);
        console.log("To 20 with a pair of 10: ");
    }

     static no_regroup() { // (33+45, 21+37, etc.)
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => v[0] + v[1] < 100);
        g.cond(v => ones(v[0]) + ones(v[1]) < 10);
        g.cond(v => tens(v[0]) + tens(v[1]) < 10);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]}`);
        this.sols = v.map(v => v[0] + v[1]);
        console.log("No regrouping: ");
    }

    static with_regroup() { // (57+24, 45+25, 61+21, 19+39)
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => v[0] + v[1] < 100);
        g.cond(v => ones(v[0]) + ones(v[1]) >= 10);
        g.cond(v => tens(v[0]) + tens(v[1]) < 9);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]}`);
        this.sols = v.map(v => v[0] + v[1]);
        console.log("With regrouping: ");
    }

    static tens_to_100() { //(50 + 30, 20 + 70, 10 + 10, etc.) 
        var g = new Gen(2);
        g.range([10, 100], [10, 100]);
        g.cond(v => v[0] % 10 == 0 && v[1] % 10 == 0);
        g.cond(v => v[0] + v[1] <= 100);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]}`);
        this.sols = v.map(v => v[0] + v[1]);
        console.log("Tens to 100: ");
    }

    static tens() { // (54+30, 20+36, 60+14, etc.)
        var g = new Gen(2);
        g.range([10, 100], [10, 100]);
        g.cond(v => v[0] % 10 == 0 || v[1] % 10 == 0);
        g.cond(v => v[0] + v[1] <= 100);
        // the code allows now for both to be multiples of 10, but we could filter that out too if desired
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]}`);
        this.sols = v.map(v => v[0] + v[1]);
        console.log("Tens: ");
    }

    static tens_to_200() { // (80+90, 70+30, 30+60, 80+80)
        var g = new Gen(2);
        g.range([10, 90], [10, 90]);
        g.cond(v => v[0] % 10 == 0 && v[1] % 10 == 0);
        g.cond(v => v[0] + v[1] <= 200);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]}`);
        this.sols = v.map(v => v[0] + v[1]);
        console.log("Tens to 200: ");
    }

    static to_200() { // (71+35, 89+65, 23+44, etc.)
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => v[0] + v[1] <= 200);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]}`);
        this.sols = v.map(v => v[0] + v[1]);
        console.log("To 200: ");
    }

    static tens_to_1000() { // (140+670, 200+590, 360+290)
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => v[0] + v[1] <= 100);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]}0 + ${v[1]}0`);
        this.sols = v.map(v => 10 * (v[0] + v[1]));
        console.log("Tens to 1000: ");
    }

    // this one runs somewhat slowly since it is about 1000^2 space
    static to_1000() {
        var g = new Gen(2);
        g.range([100, 999], [100, 999]);
        g.cond(v => v[0] + v[1] <= 1000);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} + ${v[1]}`);
        this.sols = v.map(v => v[0] + v[1]);
        console.log("To 1000: ");
    }
}

// Subtraction

var Subtraction = class extends Category {

    static within_20() { // (13-7, 19-12, 9-6, etc.)
        var g = new Gen(2);
        g.range([1, 20], [1, 20]);
        g.cond(v => v[0] - v[1] > 0);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} - ${v[1]}`);
        this.sols = v.map(v => v[0] - v[1]);
        console.log("Within 20: ");
    }

    static tens_to_100() { // 50-30, 70-20, etc.
        var g = new Gen(2);
        g.range([1, 9], [1, 9]);
        g.cond(v => v[0] >= v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]}0 - ${v[1]}0`);
        this.sols = v.map(v => 10 * (v[0] - v[1]));
        console.log("Tens to 100: ");
    }

    static subtracting_tens() { // (86-30, 59-20, 44-10, etc.)
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => v[1] % 10 == 0);
        g.cond(v => v[0] >= v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} - ${v[1]}`);
        this.sols = v.map(v => v[0] - v[1]);
        console.log("Subtracting tens: ");

    }

    static no_regroup() { // (89-44, 62-40, 85-63, etc.)
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => ones(v[0]) >= ones(v[1]));
        g.cond(v => v[0] > v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} - ${v[1]}`);
        this.sols = v.map(v => v[0] - v[1]);
        console.log("No regrouping: ");
    }

     // note that this can include slightly silly things like 20-19
     static regroup() { // (45-37, 91-18, etc.) 
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => ones(v[0]) < ones(v[1]));
        g.cond(v => v[0] > v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} - ${v[1]}`);
        this.sols = v.map(v => v[0] - v[1]);
        console.log("With regrouping: ");
     }

    static tens_to_200() { // (180-50, 100-70, 90-40, 190-130)
        var g = new Gen(2);
        g.range([1, 19], [1, 19]);
        g.cond(v => v[0] >= v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]}0 - ${v[1]}0`);
        this.sols = v.map(v => 10 * (v[0] - v[1]));
        console.log("Tens to 200: ");
    }

    static crossing_100() { // (132-45, 108-90, 175-113, etc.)
        var g = new Gen(2);
        g.range([1, 99], [1, 99]);
        g.cond(v => v[0] < v[1])
        var v = g.generate();
        this.probs = v.map(v => `${100 + v[0]} - ${v[1]}`);
        this.sols = v.map(v => 100 + v[0] - v[1]);
        console.log("Crossing 100: ");
    }

    static to_200() { // (196-55, 45-18, 113-92, etc.)
        var g = new Gen(2);
        g.range([10, 200], [10, 200]);
        g.cond(v => v[0] > v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} - ${v[1]}`);
        this.sols = v.map(v => v[0] - v[1]);
        console.log("To 200: ");
    }

    static tens_to_1000() { //  (790-180, etc.)
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => v[0] > v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]}0 - ${v[1]}0`);
        this.sols = v.map(v => 10 * (v[0] - v[1]));
        console.log("Tens to 1000: ");
    }

    // this one runs a little slow since it is about 1000^2 space
    static to_1000() { // To 1000 (722-654, etc.)
        var g = new Gen(2);
        g.range([100, 999], [100, 999]);
        g.cond(v => v[0] > v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} - ${v[1]}`);
        this.sols = v.map(v => v[0] - v[1]);
        console.log("To 1000: ");
    }
}

// Multiplication

var Multiplication = class extends Category {
 
    static by_0_1_2_10() { // (single-digit by these)
        var g = new Gen(2);
        g.range([0, 10], [0, 10]);
        g.cond(v => [0, 1, 2, 10].indexOf(v[0]) != -1);
        g.cond(v => v[1] < 10);
        var v = g.generate();
        v = v.flatMap(v => [v, [v[1], v[0]]]); // include (a, b) and (b, a) in our list
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("By 0, 1, 2, or 10: ");
    }

    static by_3_4_5() { // (single-digit by these)
        var g = new Gen(2);
        g.range([0, 9], [0, 9]);
        g.cond(v => [3, 4, 5].indexOf(v[0]) != -1);
        var v = g.generate();
        v = v.flatMap(v => [v, [v[1], v[0]]]); // include (a, b) and (b, a) in our list
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("By 3, 4, or 5: ");
    }

    static by_6_7_8_9() { // (single-digit by these)
        var g = new Gen(2);
        g.range([0, 9], [0, 9]);
        g.cond(v => [6, 7, 8, 9].indexOf(v[0]) != -1);
        var v = g.generate();
        v = v.flatMap(v => [v, [v[1], v[0]]]); // include (a, b) and (b, a) in our list
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("By 6, 7, 8, or 9: ");
    }

    // Commenting this one out since it has less than N = 20 samples to choose
    // from and causes weird code errors otherwise...
    
    // static squares() { // 3*3, 5*5, other single digits, etc.
    //     var g = new Gen(1);
    //     g.range([1, 9]);
    //     var v = g.generate();
    //     this.probs = v.map(v => `${v} × ${v}`);
    //     this.sols = v.map(v => v * v);
    //     console.log("Squares: ");
    // }

    static facts_to_10() {
        var g = new Gen(2);
        g.range([0, 10], [0, 10]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("Facts to 10: ");
    }

    // could be a case where we want a biased distrbution to include more 11s and 12s
    static facts_to_12() {
        var g = new Gen(2);
        g.range([0, 12], [0, 12]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("Facts to 12: ");
    }

    static tens() { // (20x60, 300x50, 200x500)
        var g = new Gen(2);
        g.range([1, 9], [1, 9]);
        var v = g.generate();
        v = v.flatMap(v => [[v[0] * 10, v[1] * 10], [v[0] * 100, v[1] * 10], [v[0] * 10, v[1] * 100], [v[0] * 100, v[1] * 100]]);
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("Tens: ");
    }

    static one_by_2_200() { // (6×13, 5x31, 8x14, etc.)
        var g = new Gen(2);
        g.range([2, 9], [10, 99]);
        g.cond(v => v[0] * v[1] <= 200);
        var v = g.generate();
        v = v.flatMap(v => [v, [v[1], v[0]]]); // include (a, b) and (b, a) in our list
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("1-by-2 to 200: ");
    }

    static one_by_2_1000() { // (7×61, 9×44, etc.)
        var g = new Gen(2);
        g.range([2, 9], [10, 99]);
        g.cond(v => v[0] * v[1] <= 1000);
        var v = g.generate();
        v = v.flatMap(v => [v, [v[1], v[0]]]); // include (a, b) and (b, a) in our list
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("1-by-2 to 1000: ");
    }

    static one_by_3_2000() { // (7×215, 5×351, etc.)
        var g = new Gen(2);
        g.range([2, 9], [100, 999])
        g.cond(v => v[0] * v[1] <= 2000);
        var v = g.generate();
        v = v.flatMap(v => [v, [v[1], v[0]]]); // include (a, b) and (b, a) in our list
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("1-by-3 to 2000: ");
    }

    static one_by_3_9999() { //  (7×692, 5×430, etc.)
        var g = new Gen(2);
        g.range([2, 9], [100, 999]);
        g.cond(v => v[0] * v[1] <= 9999);
        var v = g.generate();
        v = v.flatMap(v => [v, [v[1], v[0]]]); // include (a, b) and (b, a) in our list
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("1-by-3 to 9999: ");
    }

    static two_by_2_9999() { // (35×67, 21×74, etc.)
        var g = new Gen(2);
        g.range([10, 99], [10, 99]);
        g.cond(v => v[0] * v[1] <= 9999);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} × ${v[1]}`);
        this.sols = v.map(v => v[0] * v[1]);
        console.log("2-by-2 to 9999: ");
    }

}

// Division



var Division = class extends Category {

    static within_100() { // Stuff like 36 ÷ 9, 42 ÷ 14, etc.
        var g = new Gen(2);
        g.range([2, 100], [2, 100]);
        g.cond(v => v[0] % v[1] == 0);
        g.cond(v => v[0] > v[1]);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} ÷ ${v[1]}`);
        this.sols = v.map(v => v[0] / v[1]);
        console.log("Within 100: ");
    }

    static halving() { // Halving (2-digit even number divided by 2)
        var g = new Gen(1);
        g.range([10, 99]);
        g.cond(v => v % 2 == 0);
        var v = g.generate();
        this.probs = v.map(v => `${v} ÷ 2`);
        this.sols = v.map(v => v / 2);
        console.log("Halving: ");
    }

    static one_digit() { // (54÷6, 45÷9, 16÷4, etc.)
        // some quirks here: do we want a ÷ a? should the first number be 2-digits?
        var g = new Gen(2);
        g.range([2, 81], [2, 9]);
        g.cond(v => v[0] % v[1] == 0);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} ÷ ${v[1]}`);
        this.sols = v.map(v => v[0] / v[1]);
        console.log("1 digit: ");
    }


    // Commenting this one out since it has less than N = 20 sample space
    // and breaks testing

    // static by_5() { // Within 100 by 5 (85÷5, 45÷5, etc.)
    //     var g = new Gen(1);
    //     g.range([10, 100]);
    //     g.cond(v => v % 5 == 0);
    //     var v = g.generate();
    //     this.probs = v.map(v => `${v} ÷ 5`);
    //     this.sols = v.map(v => v / 5);
    //     console.log("By 5: ");
    // }

    static by_4() { // Within 100 by 4 (64÷4, 76÷4, 28÷4, etc.)
        var g = new Gen(1);
        g.range([10, 100]);
        g.cond(v => v % 4 == 0);
        var v = g.generate();
        this.probs = v.map(v => `${v} ÷ 4`);
        this.sols = v.map(v => v / 4);
        console.log("By 4: ");
    }

    static by_3() { // Within 100 by 3 (39÷3, 54÷3, 84÷3, 15÷3, etc.)
        var g = new Gen(1);
        g.range([10, 100]);
        g.cond(v => v % 3 == 0);
        var v = g.generate();
        this.probs = v.map(v => `${v} ÷ 3`);
        this.sols = v.map(v => v / 3);
        console.log("By 3: ");
    }

    static one_digit_remainder() { // (76÷9, 82÷6)
        var g = new Gen(2);
        g.range([2, 81], [2, 9]);
        g.cond(v => v[0] > v[1]);
        g.cond(v => v[0] % v[1] != 0);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} ÷ ${v[1]}`);
        this.sols = v.map(v => `${Math.floor(v[0] / v[1])} R ${v[0] % v[1]}`); // division with remainders
        console.log("One digit with remainder: ");
    }

    static long_div_3_by_1() { // (174÷3, 655÷5, 792÷9, etc.)
        var g = new Gen(2);
        g.range([100, 999], [2, 9]);
        g.cond(v => v[0] % v[1] == 0);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} ÷ ${v[1]}`);
        this.sols = v.map(v => v[0] / v[1]);
        console.log("Long division 3 by 1: ");
    }

    static long_div_3_by_1_remainder() { // (286÷9, 556÷4, etc.)
        var g = new Gen(2);
        g.range([100, 999], [2, 9]);
        g.cond(v => v[0] % v[1] != 0);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} ÷ ${v[1]}`);
        this.sols = v.map(v => `${Math.floor(v[0] / v[1])} R ${v[0] % v[1]}`);
        console.log("Long division 3 by 1 with remainder: ");
    }

    static long_div_3_by_2_remainder() { // (561÷34, 916÷13, etc)
        var g = new Gen(2);        
        g.range([100, 999], [10, 99]);
        g.cond(v => v[0] % v[1] != 0);
        var v = g.generate();
        this.probs = v.map(v => `${v[0]} ÷ ${v[1]}`);
        this.sols = v.map(v => `${Math.floor(v[0] / v[1])} R ${v[0] % v[1]}`);
        console.log("Long division 3 by 2 with remainder: ");
    }
}

// Testing

// Test a class (Addition, Subtraction, Multiplication, or Division) by running the command

// `runAllProbs(Addition); `

// or whatever the class is you want to test. You should see a printout of the name of each problem type, followed by a list of 20 randomly selected problems without repeats.

// You can also run the commands

// `runAllSols(Addition); `

// and 

// `runAllProbsAndSols(Addition); `

// which will printout just the numerical answers, or the problem statements with the numerical answers, respectively.

// runAllProbs(Addition);
// runAllSols(Addition);
runAllProbsAndSols(Addition);