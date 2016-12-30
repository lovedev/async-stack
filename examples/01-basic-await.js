'use strict';
let AsyncStack = require('../lib/async-stack');

function first(stack, msg){
    setTimeout(function(){
        console.log('first done');
        stack.done(msg);
    }, 2000);
}

function second(stack, firstResult) {
    setTimeout(function(){
        console.log(firstResult);
        console.log('second done');
        stack.done(firstResult);
    }, 1000);
}

function third(stack, secondResult){
    console.log(secondResult);
    console.log('third done');
    stack.done('call', 'complete', 'function');
}

let stack = new AsyncStack();
stack.await(first, 'hello').await(second).await(third);
stack.done((stack)=>{
   console.log(stack.result());
});
stack.run();

// call results
//------------------------------------------------------------------------------
// first done
// hello
// second done
// hello
// third done
// [ [ 'hello' ], [ 'hello' ], [ 'call', 'complete', 'function' ] ]
