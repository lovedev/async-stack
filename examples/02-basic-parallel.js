'use strict';
let AsyncStack = require('../lib/async-stack');

function first(stack, msg){
    setTimeout(function(){
        console.log(msg)
        console.log('first done');
        stack.done('first result');
    }, 2000);
}

function second(stack) {
    setTimeout(function(){
        console.log('second done');
        stack.done('second result');
    }, 1000);
}

function third(stack){
    console.log('third done');
    stack.done('third result');
}

let stack = new AsyncStack();
stack.pass(first, 'hello').pass(second).pass(third);
stack.done((stack)=>{
   console.log(stack.passResult());
});
stack.run();

// call results
//------------------------------------------------------------------------------
// third done
// second done
// hello
// first done
// [ [ 'first result' ], [ 'second result' ], [ 'third result' ] ]
