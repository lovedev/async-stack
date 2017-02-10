'use strict';
let AsyncStack = require('../lib/async-stack');

function first(stack){
    console.log(1);
    setTimeout(function(){
        stack.done(1);
    }, 2000);
}

function second(stack) {
    setTimeout(function(){
        console.log(2);
        stack.done(2);
    }, 1000);
}

function third(stack){
    console.log(3);
    stack.done(3);
}

let stack = new AsyncStack();
stack.await(first, 'hello').await(second).await(third);
stack.done((stack)=>{
   console.log(stack.result());
});
stack.run();

/* call results
------------------------------------------------------------------------------
1
2
3
[ [ 1 ], [ 2 ], [ 3 ] ]
*/
